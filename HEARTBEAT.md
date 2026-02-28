# HEARTBEAT.md

## 30‑Minute Check (08:00–22:00)
- **Cron errors only**: alert if any cron job shows error/consecutiveErrors > 0
- **Calendar**: flag events starting within next 2 hours
- **Email**: surface any urgent/unread items

## Multi-Agent Squad Monitoring

Check if agent cron jobs have stale lastRunAtMs (>26h since last run).
If stale, trigger via: `openclaw cron run <jobId> --force`

| Agent | Job | ID | Schedule |
|-------|-----|-----|----------|
| Sherlock | Research (Morning) | 3fd6d3f4-9c31-4348-8e35-5496b906e3af | 8 AM |
| Sherlock | Research (Afternoon) | cfdb2c59-0f29-470d-98ad-b8cb48b46133 | 2 PM |
| Sherlock | Research (Evening) | f17d34ac-48aa-4145-b70c-97c00df9f9ab | 6 PM |
| Scribe | Content (Morning) | 0ec98999-04c7-4e31-ba6d-8f74cf762648 | 9 AM |
| Scribe | Content (Evening) | 8813b105-8877-401e-bb7c-a54ee67497a8 | 5 PM |
| Editor | Newsletter | f068cd53-946b-41c9-9b24-2f617c77c246 | Sun 6 PM |
| Architect | Engineering | 2c25d4cd-e8b5-4634-87fd-e7b328bcc64c | 10 AM |

If nothing needs attention: reply **HEARTBEAT_OK**.
