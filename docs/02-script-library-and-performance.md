# Script Library and Performance

## Script selection rules

- Candidate scripts must match lead tier and outreach stage.
- Prefer scripts with higher `performance_score`.
- Tie-break on more observations (`total_touches`) and freshness.
- Skip inactive scripts.

## Performance update formula

```text
performance_score = (booked_calls + 0.5 * replies) / total_touches
```

If `total_touches = 0`, score is `0`.

## Example API payloads

### Add script

```json
{
  "name": "Tier 2 Cold Email A",
  "type": "cold_email",
  "tier_target": 2,
  "content": "Hi {{owner_name}}, ...",
  "active": true
}
```

### Execute touchpoint

```json
{
  "lead_id": 101,
  "type": "email",
  "script_id": 12,
  "outcome": "replied",
  "notes": "Interested in a redesign quote"
}
```

### Script performance response

```json
{
  "script_id": 12,
  "total_touches": 40,
  "total_replies": 9,
  "total_booked_calls": 3,
  "performance_score": 0.375
}
```
