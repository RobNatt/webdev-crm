# Minimal UI and API

## Components

- `LeadUploadCard`
- `LeadList`
- `TodayToDoPanel`
- `ScriptLibrary`
- `ScriptPerformanceTable`
- `LeadDetailDrawer`

## Example endpoint surface

- `POST /leads/upload-csv`
- `GET /leads`
- `POST /touchpoints`
- `GET /today-todo?limit=30`
- `GET /scripts`
- `POST /scripts`
- `PATCH /scripts/:id`
- `PATCH /user-settings` (includes `max_daily_outreach`, clamped to 20-30)

## UI cap behavior

- Show badge: `Today 17 / 30`.
- Disable "Add outreach task" when count reaches cap.
- Show helper text when blocked: `Daily cap reached.`
- Disable outreach actions when lead is dead/closed/3-touch complete.
