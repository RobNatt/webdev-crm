CREATE TYPE contact_method_enum AS ENUM ('email', 'call');
CREATE TYPE reply_status_enum AS ENUM ('no_reply', 'replied', 'booked_call', 'no_further_follow_up');
CREATE TYPE script_type_enum AS ENUM ('cold_email', 'cold_call', 'follow_up');
CREATE TYPE touchpoint_type_enum AS ENUM ('email', 'call');

CREATE TABLE scripts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type script_type_enum NOT NULL,
  content TEXT NOT NULL,
  tier_target SMALLINT NOT NULL CHECK (tier_target BETWEEN 1 AND 5),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  performance_score NUMERIC(6,4) NOT NULL DEFAULT 0,
  total_touches INT NOT NULL DEFAULT 0,
  total_replies INT NOT NULL DEFAULT 0,
  total_booked_calls INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  website TEXT,
  location TEXT,
  phone TEXT,
  owner_name TEXT,
  email TEXT,
  tier SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 5),
  last_contact_date DATE,
  contact_method contact_method_enum,
  reply_status reply_status_enum NOT NULL DEFAULT 'no_reply',
  attached_script_id BIGINT REFERENCES scripts(id),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  next_action_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE touchpoints (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type touchpoint_type_enum NOT NULL,
  touchpoint_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  script_id BIGINT REFERENCES scripts(id),
  outcome reply_status_enum NOT NULL,
  notes TEXT
);

CREATE TABLE user_settings (
  user_id BIGINT PRIMARY KEY,
  max_daily_outreach SMALLINT NOT NULL DEFAULT 30 CHECK (max_daily_outreach BETWEEN 20 AND 30),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
