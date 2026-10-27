#!/usr/bin/env python3
"""Test the Real Estate & Construction application form, alone.

FORM      Real Estate & Construction
URL       https://finance.rrecktek.com/apply/cre
PRODUCT   cre
BACKEND   POST /api/leads on crewai-lenderdb, 192.168.206.8

WHAT THIS CHECKS
  1. The URL serves the Real Estate & Construction form and no other. A status code is
     not evidence here: the Caddy block for finance.rrecktek.com ends in
     try_files, so every path returns HTTP 200, including invented ones. The
     check reads the active tab out of the rendered page instead.
  2. Every required field accepts input and the form submits.
  3. The submission reaches the database as a lead whose product is "cre".
  4. The AWS Notify attempt is recorded against that lead.

TWO MODES

  api   default. Posts to /api/leads directly with skip_notify set, then
        confirms the lead landed. Sends no text message, so it consumes none of
        the Notify allowance and is safe to run as often as wanted.

  ui    drives a real browser against the form URL. This is the only mode that
        proves the page works, and it DOES send one text message, because the
        page always notifies. AWS Notify permits 10 messages per destination
        per day across all four forms together, so budget accordingly.

RUNNING

    pip install playwright && playwright install chromium     # ui mode only
    python3 test-apply-cre.1792806000.py                # api mode
    python3 test-apply-cre.1792806000.py --mode ui       # real browser, sends one text

  A host with no browser and no network path to the site can still run api
  mode from 192.168.206.8 itself. ui mode can be run inside the container
  crewai-lenderdb-crawler on that host, which already carries playwright and
  chromium:

    docker exec crewai-lenderdb-crawler python /path/to/this/file --mode ui

EXIT STATUS
  0 on pass, 1 on failure. Every check prints its own line.
"""

import argparse
import json
import shlex
import subprocess
import sys
import time
import urllib.request

FORM_KEY = "cre"
FORM_LABEL = "Real Estate & Construction"
FORM_URL = "https://finance.rrecktek.com/apply/cre"
API_URL = "https://finance.rrecktek.com/api/leads"
SUBMISSIONS_URL = "https://finance.rrecktek.com/api/submissions"
DB_HOST = "192.168.206.8"

# Required text fields for this form, by the label rendered beside each one.
TEXT_FIELDS = {
    "Full Name *": None,            # filled with the run marker
    "Email Address *": "formtest@rrecktek.com",
    "Phone *": "+1 248 444 0835",
    "Deal Amount *": "2500000",
    "Executive Summary / Description *": "Test submission. Ground up multifamily, 120 units, exit by refinance.",
}

results = []


def check(name, ok, detail=""):
    results.append(ok)
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" | {detail}" if detail else ""))
    return ok


def marker():
    return f"FORMTEST {FORM_KEY} {int(time.time())}"


def lead_in_db(name):
    """Look the lead up by name. Returns the row as a dict, or None.

    Three routes are tried, so the test runs from anywhere:

      1. GET /api/submissions, which joins leads to sms_log and needs no
         credentials. This is the portable route and the one that works from
         inside a container with no docker socket and no ssh.
      2. docker exec against postgres-pgvector, for a run on 192.168.206.8.
      3. The same query over ssh to that host.

    Keys are normalised to the database column names in every case.
    """
    try:
        with urllib.request.urlopen(SUBMISSIONS_URL, timeout=30) as r:
            payload = json.load(r)
        for row in payload.get("data", []):
            if row.get("name") == name:
                return {"id": row.get("id"), "product": row.get("product"),
                        "source": row.get("source"), "deal_amount": row.get("deal_amount"),
                        "success": row.get("sms_sent"), "text_id": row.get("sms_text_id"),
                        "error": row.get("sms_error")}
    except Exception:
        pass

    sql = (
        "SELECT json_agg(t) FROM (SELECT l.id, l.product, l.source, l.deal_amount, "
        "s.success, s.text_id, s.error FROM leads l LEFT JOIN sms_log s ON s.lead_id = l.id "
        f"WHERE l.name = '{name}' ORDER BY l.created_at DESC LIMIT 1) t;"
    )
    cmd = ["docker", "exec", "postgres-pgvector", "psql", "-U", "postgres",
           "-d", "lenderdb", "-t", "-A", "-c", sql]
    attempts = [cmd, ["ssh", "-o", "BatchMode=yes", DB_HOST,
                      " ".join(shlex.quote(a) for a in cmd)]]
    for attempt in attempts:
        try:
            out = subprocess.run(attempt, capture_output=True, timeout=45).stdout.decode().strip()
        except Exception:
            continue
        if not out:
            continue
        try:
            rows = json.loads(out)
        except Exception:
            continue
        if rows:
            return rows[0]
    return None


def run_api():
    name = marker()
    body = {"product": FORM_KEY, "source": "apply_page", "preferred_partner": "rcr",
            "name": name, "email": TEXT_FIELDS["Email Address *"],
            "phone": TEXT_FIELDS["Phone *"], "dealAmount": TEXT_FIELDS["Deal Amount *"],
            "description": TEXT_FIELDS["Executive Summary / Description *"], "skip_notify": True}
    req = urllib.request.Request(API_URL, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        payload = json.load(r)
    check("api accepted the submission", payload.get("success") is True, str(payload)[:160])
    row = lead_in_db(name)
    check("lead reached the database", row is not None, name)
    if row:
        check(f"product is {FORM_KEY}", row.get("product") == FORM_KEY, f"got {row.get('product')!r}")
        check("notify was skipped as asked", row.get("success") is None,
              f"sms_log success={row.get('success')!r}")


def run_ui():
    from playwright.sync_api import sync_playwright
    name = marker()
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])
        page = browser.new_page()
        page.goto(FORM_URL, timeout=40000, wait_until="networkidle")

        tab = page.locator("[data-state=active][role=tab]").first.inner_text().replace("\n", " ").strip()
        check(f"{FORM_URL} serves the {FORM_LABEL} form", FORM_LABEL in tab, f"active tab {tab!r}")

        # The Field component renders <Label> with no htmlFor and <Input> with no
        # id, so the two are not associated and get_by_label cannot find them.
        # The input is a sibling of the label inside the field wrapper, so it is
        # reached from the label text instead.
        # Some inputs sit directly beside the label, others are nested inside a
        # wrapper, such as Deal Amount which carries a currency prefix. Searching
        # down from the field wrapper covers both.
        for label, value in TEXT_FIELDS.items():
            box = page.locator(
                f'xpath=//label[normalize-space(.)="{label}"]'
                '/..//*[self::input or self::textarea][1]'
            )
            box.fill(value if value else name, timeout=15000)

        # Any remaining required dropdown gets its first option.
        for i in range(page.locator("[role=combobox]").count()):
            box = page.locator("[role=combobox]").nth(i)
            try:
                box.click(timeout=4000)
                page.locator("[role=option]").first.click(timeout=4000)
            except Exception:
                pass

        page.get_by_role("button", name="Submit Application").click(timeout=10000)
        page.wait_for_selector("text=Application Submitted", timeout=25000)
        check("the form reported the application as submitted", True)
        browser.close()

    time.sleep(3)
    row = lead_in_db(name)
    check("lead reached the database", row is not None, name)
    if row:
        check(f"product is {FORM_KEY}", row.get("product") == FORM_KEY, f"got {row.get('product')!r}")
        check("notify was attempted and recorded", row.get("success") is not None,
              f"success={row.get('success')!r} id={row.get('text_id')!r} error={str(row.get('error'))[:90]!r}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=f"Test the {FORM_LABEL} form alone.")
    ap.add_argument("--mode", choices=["api", "ui"], default="api",
                    help="api sends no text message; ui drives the real page and sends one")
    args = ap.parse_args()

    print(f"=== {FORM_LABEL} | {FORM_URL} | mode={args.mode}")
    try:
        run_ui() if args.mode == "ui" else run_api()
    except Exception as e:
        check("test ran to completion", False, f"{type(e).__name__}: {e}")

    print(f"=== {sum(results)}/{len(results)} checks passed")
    sys.exit(0 if results and all(results) else 1)
