-- ============================================================
-- LenderDB PostgreSQL Schema
-- Requires: pgvector extension for AI deal-matching
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE institution_type AS ENUM (
  'bank',
  'captive_finance',
  'private_lender',
  'fund',
  'credit_union',
  'specialty_finance',
  'cdfi'
);

CREATE TYPE loan_type AS ENUM (
  'lease',
  'loan',
  'sale_leaseback',
  'vendor_finance',
  'structured_finance',
  'operating_lease',
  'trac_lease',
  'fmv_lease',
  'line_of_credit',
  'working_capital'
);

CREATE TYPE borrower_type AS ENUM (
  'startup',
  'sme',
  'corporate',
  'government',
  'nonprofit'
);

CREATE TYPE application_process AS ENUM (
  'online',
  'broker',
  'direct',
  'hybrid'
);

CREATE TYPE recourse_type AS ENUM (
  'recourse',
  'non_recourse',
  'limited_recourse'
);

CREATE TYPE signal_type AS ENUM (
  'positive',
  'caution',
  'negative'
);

CREATE TYPE data_source_type AS ENUM (
  'association',
  'regulatory',
  'marketplace',
  'vendor',
  'conference',
  'direct',
  'broker_network',
  'web_crawl',
  'linkedin',
  'press_release'
);

CREATE TYPE lender_status AS ENUM (
  'active',
  'paused',
  'inactive',
  'unverified'
);

-- ============================================================
-- CORE LENDER TABLE
-- ============================================================

CREATE TABLE lenders (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 1. Identification
  lender_name               TEXT NOT NULL,
  legal_entity_name         TEXT,
  parent_organization       TEXT,
  institution_type          institution_type NOT NULL,
  country                   CHAR(2) NOT NULL,               -- ISO 3166-1 alpha-2
  headquarters_city         TEXT,
  headquarters_state        CHAR(2),                        -- US only
  website_url               TEXT,

  -- 2. Contact Channels
  general_email             TEXT,
  origination_email         TEXT,
  phone                     TEXT,
  linkedin_page             TEXT,

  -- 3. Deal Parameters
  minimum_deal_size         NUMERIC(15, 2),
  maximum_deal_size         NUMERIC(15, 2),
  typical_deal_size         NUMERIC(15, 2),
  currency                  CHAR(3) NOT NULL DEFAULT 'USD', -- ISO 4217
  recourse                  recourse_type,

  -- 4. Credit Profile
  target_borrower_types     borrower_type[],
  minimum_revenue           NUMERIC(15, 2),
  minimum_years_in_business NUMERIC(4, 1),
  credit_score_threshold    INTEGER CHECK (credit_score_threshold BETWEEN 300 AND 850),
  collateral_requirements   TEXT,
  personal_guarantee        BOOLEAN,

  -- 5. Geographic / Regulatory
  licensing_status          TEXT,
  regulatory_authority      TEXT,

  -- 6. Operational
  application_process       application_process,
  documentation_requirements TEXT,
  typical_approval_days     NUMERIC(5, 1),
  funding_days              NUMERIC(5, 1),

  -- 7. Risk / Specialty
  high_risk_industries_accepted BOOLEAN DEFAULT FALSE,
  cross_border_financing    BOOLEAN DEFAULT FALSE,
  used_equipment            BOOLEAN DEFAULT FALSE,
  startup_friendly          BOOLEAN DEFAULT FALSE,
  broker_friendly           BOOLEAN DEFAULT FALSE,
  broker_registration_required BOOLEAN DEFAULT TRUE,

  -- 8. AI-Matching Metadata
  risk_appetite_score       INTEGER CHECK (risk_appetite_score BETWEEN 0 AND 100),
  lender_category_tags      TEXT[],
  preferred_deal_profile    TEXT,                           -- human-readable summary for embedding
  deal_profile_embedding    vector(1536),                   -- pgvector: OpenAI text-embedding-3-small
                                                            -- switch to vector(768) for smaller models

  -- 9. Data Maintenance
  confidence_score          INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  last_verified_date        TIMESTAMPTZ,
  status                    lender_status NOT NULL DEFAULT 'unverified',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT deal_size_order CHECK (
    minimum_deal_size IS NULL OR maximum_deal_size IS NULL OR
    minimum_deal_size <= maximum_deal_size
  ),
  CONSTRAINT typical_in_range CHECK (
    typical_deal_size IS NULL OR (
      (minimum_deal_size IS NULL OR typical_deal_size >= minimum_deal_size) AND
      (maximum_deal_size IS NULL OR typical_deal_size <= maximum_deal_size)
    )
  )
);

-- ============================================================
-- CONTACTS (one-to-many — a lender may have multiple contacts)
-- ============================================================

CREATE TABLE lender_contacts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id       UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  key_contact_name  TEXT,
  key_contact_title TEXT,
  email           TEXT,
  phone           TEXT,
  linkedin_url    TEXT,
  is_primary      BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LOAN TYPES (many-to-many)
-- ============================================================

CREATE TABLE lender_loan_types (
  lender_id   UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  loan_type   loan_type NOT NULL,
  PRIMARY KEY (lender_id, loan_type)
);

-- ============================================================
-- INDUSTRIES (served and excluded)
-- ============================================================

CREATE TABLE lender_industries (
  lender_id   UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  industry    TEXT NOT NULL,
  excluded    BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE = excluded, FALSE = served
  PRIMARY KEY (lender_id, industry, excluded)
);

-- ============================================================
-- EQUIPMENT TYPES
-- ============================================================

CREATE TABLE lender_equipment_types (
  lender_id       UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  equipment_type  TEXT NOT NULL,
  PRIMARY KEY (lender_id, equipment_type)
);

-- ============================================================
-- REGIONS / GEOGRAPHIES
-- ============================================================

CREATE TABLE lender_regions (
  lender_id         UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  country           CHAR(2),             -- ISO alpha-2, NULL if state-level only
  state_province    CHAR(3),             -- e.g. TX, CA, ON
  region_label      TEXT,                -- e.g. 'Southeast Asia', 'DACH'
  allowed           BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE = explicitly excluded
  PRIMARY KEY (lender_id, COALESCE(country,''), COALESCE(state_province,''))
);

-- ============================================================
-- JURISDICTIONS / REGULATORY AUTHORIZATIONS
-- ============================================================

CREATE TABLE lender_jurisdictions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id           UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  jurisdiction        TEXT NOT NULL,    -- e.g. 'United States - Federal', 'California', 'FCA UK'
  regulatory_body     TEXT,
  license_number      TEXT,
  license_type        TEXT,
  authorized_since    DATE,
  expires_on          DATE,
  is_active           BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- APPETITE SIGNALS (dynamic intelligence — refreshed frequently)
-- ============================================================

CREATE TABLE appetite_signals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id     UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  signal_text   TEXT NOT NULL,
  signal_type   signal_type NOT NULL,
  source_name   TEXT,
  source_url    TEXT,
  detected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,           -- optional: set 180 days out for auto-decay
  is_active     BOOLEAN DEFAULT TRUE,
  embedding     vector(1536)           -- optional: embed signals for semantic search
);

-- ============================================================
-- HISTORICAL DEALS (anonymized deal comps for AI training)
-- ============================================================

CREATE TABLE historical_deals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id       UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  deal_size       NUMERIC(15, 2),
  currency        CHAR(3) DEFAULT 'USD',
  industry        TEXT,
  equipment_type  TEXT,
  borrower_country CHAR(2),
  loan_type       loan_type,
  approved        BOOLEAN,
  funded_at       DATE,
  source          TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DATA SOURCES / CRAWL PROVENANCE
-- ============================================================

CREATE TABLE lender_sources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id       UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  source_name     TEXT NOT NULL,
  source_type     data_source_type NOT NULL,
  crawl_source_url TEXT,
  last_crawled_at TIMESTAMPTZ,
  data_snapshot   JSONB,              -- raw extracted fields from this source
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Core lookups
CREATE INDEX idx_lenders_status         ON lenders(status);
CREATE INDEX idx_lenders_country        ON lenders(country);
CREATE INDEX idx_lenders_institution    ON lenders(institution_type);
CREATE INDEX idx_lenders_deal_size      ON lenders(minimum_deal_size, maximum_deal_size);
CREATE INDEX idx_lenders_verified       ON lenders(last_verified_date);
CREATE INDEX idx_lenders_confidence     ON lenders(confidence_score);
CREATE INDEX idx_lenders_broker         ON lenders(broker_friendly);
CREATE INDEX idx_lenders_tags           ON lenders USING GIN(lender_category_tags);
CREATE INDEX idx_lenders_borrower_types ON lenders USING GIN(target_borrower_types);

-- AI vector similarity search (HNSW — best for high-recall matching)
-- Switch to IVFFlat if dataset > 1M rows
CREATE INDEX idx_lenders_embedding ON lenders
  USING hnsw (deal_profile_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_signals_embedding ON appetite_signals
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Relational lookups
CREATE INDEX idx_industries_lender   ON lender_industries(lender_id);
CREATE INDEX idx_industries_name     ON lender_industries(industry);
CREATE INDEX idx_equipment_lender    ON lender_equipment_types(lender_id);
CREATE INDEX idx_regions_lender      ON lender_regions(lender_id);
CREATE INDEX idx_regions_country     ON lender_regions(country);
CREATE INDEX idx_signals_lender      ON appetite_signals(lender_id);
CREATE INDEX idx_signals_active      ON appetite_signals(lender_id, is_active, detected_at DESC);
CREATE INDEX idx_sources_lender      ON lender_sources(lender_id);
CREATE INDEX idx_deals_lender        ON historical_deals(lender_id);
CREATE INDEX idx_jurisdictions_lender ON lender_jurisdictions(lender_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lenders_updated_at
  BEFORE UPDATE ON lenders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- DEAL MATCHING VIEW
-- Returns a flat, denormalized row per lender — efficient for
-- the matcher to filter before vector similarity is applied.
-- ============================================================

CREATE OR REPLACE VIEW lender_match_view AS
SELECT
  l.id,
  l.lender_name,
  l.institution_type,
  l.country,
  l.minimum_deal_size,
  l.maximum_deal_size,
  l.typical_deal_size,
  l.currency,
  l.credit_score_threshold,
  l.minimum_years_in_business,
  l.typical_approval_days,
  l.funding_days,
  l.startup_friendly,
  l.used_equipment,
  l.cross_border_financing,
  l.broker_friendly,
  l.risk_appetite_score,
  l.confidence_score,
  l.deal_profile_embedding,
  l.lender_category_tags,

  -- Aggregated arrays for fast filter-before-match
  ARRAY_AGG(DISTINCT lt.loan_type)         FILTER (WHERE lt.loan_type IS NOT NULL)        AS loan_types,
  ARRAY_AGG(DISTINCT li.industry)          FILTER (WHERE li.industry IS NOT NULL AND NOT li.excluded) AS industries_served,
  ARRAY_AGG(DISTINCT li.industry)          FILTER (WHERE li.industry IS NOT NULL AND li.excluded)     AS industries_excluded,
  ARRAY_AGG(DISTINCT et.equipment_type)    FILTER (WHERE et.equipment_type IS NOT NULL)    AS equipment_types,
  ARRAY_AGG(DISTINCT lr.country)           FILTER (WHERE lr.country IS NOT NULL AND lr.allowed)       AS countries_served

FROM lenders l
LEFT JOIN lender_loan_types     lt ON lt.lender_id = l.id
LEFT JOIN lender_industries     li ON li.lender_id = l.id
LEFT JOIN lender_equipment_types et ON et.lender_id = l.id
LEFT JOIN lender_regions        lr ON lr.lender_id = l.id
WHERE l.status = 'active'
GROUP BY l.id;

-- ============================================================
-- EXAMPLE: AI DEAL MATCH QUERY
-- Given a deal embedding, find top 10 lenders by cosine similarity
-- after hard filtering on deal size and country.
--
-- Usage from application layer:
--
-- SELECT id, lender_name, risk_appetite_score,
--        1 - (deal_profile_embedding <=> $1::vector) AS similarity
-- FROM lender_match_view
-- WHERE $2 BETWEEN minimum_deal_size AND maximum_deal_size  -- deal size
--   AND $3 = ANY(countries_served)                          -- country
--   AND $4 = ANY(industries_served)                         -- industry
-- ORDER BY deal_profile_embedding <=> $1::vector
-- LIMIT 10;
-- ============================================================
