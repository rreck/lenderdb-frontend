---
title: LenderDB administration
version: 1.0.0
date: 2026-10-27
site: finance.rrecktek.com
page: /admin
---

# LenderDB administration, version 1.0.0

Administration gathers the controls that change how the site behaves, the record
of what it has received, the state of the crawler, a way to check the forms
without disturbing anyone, and the documentation of both the site and this page.
It is reached at `https://finance.rrecktek.com/admin`.

The crawler view and the submissions view were previously separate pages. They
are now tabs here. Their own addresses still answer, so an existing link keeps
working.

---

## Notify tab

**LenderDB administration, version 1.0.0**

Purpose: decide which mobile numbers hear about a new application.

| Control | What it does |
| --- | --- |
| Switch | Turns one number on or off. The change takes effect on the next submission. Flipping it sends nothing |
| On count | How many numbers are currently armed |
| Add a number | Records a new destination, always switched off |
| Refresh | Rereads the list from the database rather than from the page |

Any combination is allowed, including all numbers at once and none of them. With
every switch off the forms keep working and no alert leaves the system. Each
armed number receives its own message, and each message is recorded separately,
so one number failing does not hide another succeeding.

A number is accepted only in E.164 form for the United States, for example
`+12484440835`. It is added switched off so that nothing begins alerting the
moment it is typed.

What this tab cannot do. The wording of the alert is fixed, and the brand cannot
vary per message. Both belong to the Notify configuration rather than to the
message. A number is never deleted from this page.

### Why the alert carries a number and not a sentence

Alerts travel through AWS End User Messaging Notify, which accepts only approved
verification templates. What can be chosen is the brand on the configuration and
a code of four through eight digits. The loan amount therefore rides in the
code. Notify allows ten messages per destination per day and two hundred across
the account per day, and those ceilings are shared by all four forms. Past a
ceiling the application is still stored and the refusal is recorded.

---

## Submissions tab

**LenderDB administration, version 1.0.0**

Purpose: see what arrived, work through it and pass it on.

The table lists the hundred most recent applications, newest first, with the
time received, the form used, the applicant, the amount, the alert state and any
tags.

| Alert state | Meaning |
| --- | --- |
| sent | The message was accepted for delivery and an identifier came back |
| failed | The message was refused. The reason is on the row |
| none | No alert was attempted. This is the case for a Tests run, and for any submission made while every number was switched off |

### Tools

| Tool | What it does |
| --- | --- |
| Search | Matches the applicant, the email, the phone, the amount and the tags at once |
| Form | Narrows to one of the four products |
| Alert state | Narrows to sent, failed or no alert, which is the fastest way to find anyone who was never followed up |
| Hide checks | Drops the rows a Tests run created, leaving real applications only |
| Open a row | Shows the phone, website, address, reference and any alert error, and gives the tag and send controls |
| Tags | hot, callback, qualified, junk, duplicate, funded. A tag saves at once and is searchable and exportable |
| Send | Mails the whole application to any address, with an optional line of context |
| CSV | Exports what the filters currently show, for a spreadsheet |
| JSON | Exports the same, for another system |

### Tagging

A tag is stored on the application itself rather than in a separate list, so it
travels with the record into an export and needs no schema of its own. Tags are
a fixed working set rather than free text, which keeps them searchable across
sessions and across people.

### Sending a submission on

Sending is deliberate. A recipient has to be typed and Send has to be pressed.
The message carries the whole application, its tags and the fate of its alert,
rendered as plain text for a person reading it in a mail client.

Each attempt is recorded against the application with the address, the time and
the outcome, and the count shows on the row, so it is clear whether a lead has
already been passed on and to whom. A malformed address is refused before
anything is attempted. A refusal by the mail server is reported rather than
silently dropped.

### Exports

An export carries every field held about every matching submission, the whole
form body included. There is one column per form field, prefixed `form_`, plus a
column for the tags and columns for the alert outcome. The filters set on screen
apply to the export, so the file matches what is visible.

---

## Crawler tab

**LenderDB administration, version 1.0.0**

Purpose: know how current the lender record set is, and refresh it on demand.

| Figure | Meaning |
| --- | --- |
| On record | Every lender held |
| Active | Those marked active, which is the population a deal is matched against |
| Checked | Those carrying a verification date, meaning the crawler has reached them at least once |
| Confidence 60 or better | Checked records whose extracted fields scored well enough to rely on |
| Changed in 24 hours | A quick read on whether the crawler is actually working |
| Newest check | The most recent verification date in the record set |

The figures are taken from the record set itself rather than from the crawler,
so they hold even when the crawler is idle or wedged.

Below the figures is the crawler panel: live status, batch progress, the current
lender, and the controls to start a batch.

### How the crawl runs

| Job | Cadence |
| --- | --- |
| One lender | every 2 minutes |
| Batch | every 30 minutes |
| Full pass | Sunday at 02:00 |
| FDIC discovery | every 4 hours |
| SBA 7a discovery | Saturday at 03:00 |

A batch selects the records that are stale or incomplete rather than all of
them, and commits each lender as it finishes. Stopping a run therefore costs
only the lender in flight. Pages are fetched over plain HTTP first and through a
browser when the content comes back thin, then a small language model extracts
the fields.

The crawler is reached through the API, which proxies it on the internal
network, so nothing on this page depends on the crawler being published at the
edge.

### Reading a stall

A long gap in Changed in 24 hours while the status reads running means the crawl
thread has died and the flag is stale. Restarting the crawler container clears
it.

---

## Tests tab

**LenderDB administration, version 1.0.0**

Purpose: prove the submission path still works, for any or all of the four
forms, without sending a message to anyone.

Tick the forms to check, or leave all four ticked, and run.

| Check | What it proves |
| --- | --- |
| The submission was stored | A row was written and its identifier came back |
| The product is correct | The form used and the product stored agree, so the four forms are not crossing |
| The loan amount survived | The amount reached the database unchanged |
| Nothing was sent | No alert record exists against the run, which is how the page proves it stayed silent |

Each check is listed with its outcome and the value actually observed, so a
failure says what was wrong rather than only that something was.

A run is tagged `admin_test` and appears in Submissions with no alert, which is
correct rather than a fault. Hide checks removes those rows from view. Nothing
is deleted afterwards, so the evidence of each run stays.

What this tab cannot do. It does not drive a real browser. The browser checks
fill the fields, click submit and do send, so they live as four files in this
repository under `tests` and are run deliberately from a terminal. They are not
reachable from this page.

---

## Documentation tab

**LenderDB administration, version 1.0.0**

Two views. The site view describes the four forms, what happens on submission,
the alert mechanism and its ceilings, the lender record set, the crawler and the
shape of the service. The admin view is this guide.

---

## Where the state lives

**LenderDB administration, version 1.0.0**

| State | Where it is held |
| --- | --- |
| Alert destinations | A table of numbers with a label and a switch each. The API reads it on every submission, so a change needs no restart |
| Applications | One row per submission, holding the whole form body alongside the named fields |
| Tags and send history | On the application itself, inside the form body, under reserved keys |
| Alert outcomes | One row per message attempt, joined to its application, holding the identifier or the error |
| Lender records | The record set the crawler maintains and the matcher reads |

Nothing on this page holds state in the browser. Every panel reads from the API
each time it is opened or refreshed.

---

## Interfaces this page uses

**LenderDB administration, version 1.0.0**

| Method and path | Purpose |
| --- | --- |
| `GET /api/admin/notify-targets` | List every destination with its switch |
| `POST /api/admin/notify-targets` | Add a number, or switch one on or off |
| `GET /api/submissions` | The hundred most recent applications with tags and alert outcome |
| `POST /api/admin/submissions/{id}/tags` | Replace the tags on one submission |
| `POST /api/admin/submissions/{id}/email` | Send one submission to an address |
| `GET /api/admin/export` | Everything held, as JSON or CSV, honouring the filters |
| `GET /api/crawler/status` | Crawler status through the API |
| `POST /api/crawler/batch` | Start a batch |
| `GET /api/admin/crawler/coverage` | Coverage figures from the record set |
| `POST /api/admin/tests/run` | Run the form checks. Sends nothing |

Only two interfaces in the whole page cause anything to leave the system: the
send on a submission row, and a real application arriving on one of the four
forms. Everything else reads, or changes a setting that takes effect later.
