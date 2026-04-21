# Daily Cadence and To-Do Engine

## Core constraints

- A lead can receive at most 3 touchpoints total.
- After touchpoint 3, lead status becomes `no_further_follow_up`.
- Daily scheduled outreach must never exceed user cap (20-30).
- User may manually mark lead as `dead` early.

## Queue generation query (example)

```sql
WITH touch_stats AS (
  SELECT
    l.id AS lead_id,
    l.tier,
    l.status,
    l.contact_method,
    l.next_action_date,
    COUNT(t.id) AS touch_count
  FROM leads l
  LEFT JOIN touchpoints t ON t.lead_id = l.id
  WHERE l.status NOT IN ('dead', 'booked_call', 'no_further_follow_up')
  GROUP BY l.id, l.tier, l.status, l.contact_method, l.next_action_date
),
eligible AS (
  SELECT * FROM touch_stats
  WHERE touch_count < 3
    AND (next_action_date IS NULL OR next_action_date <= CURRENT_DATE)
),
cap AS (
  SELECT LEAST(30, GREATEST(20, max_daily_outreach)) AS daily_cap
  FROM user_settings
  WHERE user_id = :user_id
),
ranked AS (
  SELECT e.*,
    ROW_NUMBER() OVER (
      ORDER BY (6 - e.tier) DESC, e.next_action_date ASC NULLS LAST, e.lead_id
    ) AS rn
  FROM eligible e
)
SELECT *
FROM ranked
WHERE rn <= (SELECT daily_cap FROM cap);
```

## Decision pseudocode

```text
if lead.touch_count >= 3 and lead.status != reopened:
  block new scheduling
if today_scheduled >= effective_cap:
  block new scheduling
else:
  allow scheduling and assign best script
```
