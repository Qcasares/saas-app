# SQL: Future Notifications Query

**Saved:** 2026-02-05 10:47 GMT
**Status:** Pending more details from Q

## Query
```sql
SELECT * FROM vw_fd_notifications 
WHERE date(maturity_date) >= date('now', 'start of month', '+1 month') 
AND date(maturity_date) < date('now', 'start of month', '+2 months')
```

## Purpose
Notifications for items maturing in the next month (next calendar month window).

## Notes
- Uses `vw_fd_notifications` view
- Filters by `maturity_date` in the next month
- SQLite date functions for month-based filtering
- Q will provide more context later

## TODO
- [ ] Get more details from Q on what these notifications are for
- [ ] Set up cron job or automation for running this
- [ ] Determine notification delivery method (Telegram, etc.)
