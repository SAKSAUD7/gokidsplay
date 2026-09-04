"""
Manual SQL script to create missing marketing tables
Run this in Django shell if migrations continue to fail
"""

CREATE_MARKETING_TABLES_SQL = """
-- EmailUnsubscribe table
CREATE TABLE IF NOT EXISTS marketing_emailunsubscribe (
    id SERIAL PRIMARY KEY,
    email VARCHAR(254) UNIQUE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS marketing_emailunsubscribe_email_idx ON marketing_emailunsubscribe(email);

-- EmailTemplate table
CREATE TABLE IF NOT EXISTS marketing_emailtemplate (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- MarketingCampaign table
CREATE TABLE IF NOT EXISTS marketing_marketingcampaign (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_id INTEGER REFERENCES marketing_emailtemplate(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    recipient_type VARCHAR(20) NOT NULL DEFAULT 'ALL_ADULTS',
    custom_email_list TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    sent_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    recipient_count INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- BirthdayEmailTracker table
CREATE TABLE IF NOT EXISTS marketing_birthdayemailtracker (
    id SERIAL PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    year INTEGER NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    waiver_id INTEGER REFERENCES bookings_waiver(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES bookings_customer(id) ON DELETE SET NULL,
    UNIQUE(email, year)
);
CREATE INDEX IF NOT EXISTS marketing_birthdayemailtracker_email_year_idx ON marketing_birthdayemailtracker(email, year);

-- EmailSendLog table
CREATE TABLE IF NOT EXISTS marketing_emailsendlog (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES marketing_marketingcampaign(id) ON DELETE CASCADE,
    recipient_email VARCHAR(254) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    tracking_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    error_message TEXT
);
CREATE INDEX IF NOT EXISTS marketing_emailsendlog_campaign_status_idx ON marketing_emailsendlog(campaign_id, status);
CREATE INDEX IF NOT EXISTS marketing_emailsendlog_recipient_email_idx ON marketing_emailsendlog(recipient_email);
CREATE INDEX IF NOT EXISTS marketing_emailsendlog_tracking_id_idx ON marketing_emailsendlog(tracking_id);

-- EmailEngagement table
CREATE TABLE IF NOT EXISTS marketing_emailengagement (
    id SERIAL PRIMARY KEY,
    send_log_id INTEGER NOT NULL REFERENCES marketing_emailsendlog(id) ON DELETE CASCADE,
    event_type VARCHAR(10) NOT NULL,
    event_url VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_agent VARCHAR(500),
    ip_address INET
);
CREATE INDEX IF NOT EXISTS marketing_emailengagement_send_log_event_idx ON marketing_emailengagement(send_log_id, event_type);
CREATE INDEX IF NOT EXISTS marketing_emailengagement_created_at_idx ON marketing_emailengagement(created_at);
"""

print("SQL script ready. To execute:")
print("1. SSH into Azure")
print("2. Run: python manage.py dbshell")
print("3. Paste the SQL above")
print("4. Type \\q to exit")
