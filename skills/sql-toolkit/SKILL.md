---
name: sql-toolkit
description: Execute SQL queries against SQLite, PostgreSQL, and MySQL databases. Query, analyze, and manage data with natural language interface.
---

# SQL Toolkit

Execute SQL queries and database operations via natural language.

## Quick Start

```bash
# SQLite
sql query "SELECT * FROM users LIMIT 5" --db path/to/db.sqlite
sql tables --db path/to/db.sqlite
sql schema users --db path/to/db.sqlite

# PostgreSQL  
sql query "SELECT * FROM orders" --postgres "postgresql://user:pass@host/db"

# MySQL
sql query "SELECT * FROM products" --mysql "mysql://user:pass@host/db"
```

## Supported Databases

- **SQLite** — File-based, local databases (`.sqlite`, `.db`, `.sqlite3`)
- **PostgreSQL** — Full SQL support, complex queries
- **MySQL** — Wide compatibility, common web stack

## Security

- Never commit credentials to version control
- Use environment variables for connection strings
- Least-privilege database users
- Read-only connections for analytics

## Examples

### List all tables
```bash
sql tables --db ~/.openclaw/memory/main.sqlite
```

### View table schema
```bash
sql schema telegram_messages --db ~/.openclaw/memory/main.sqlite
```

### Run query and export to CSV
```bash
sql query "SELECT * FROM users WHERE created_at > date('now', '-7 days')" --db app.db --csv output.csv
```

### Analyze data
```bash
sql analyze "orders" --group-by "status" --sum "amount" --db production.sqlite
```

## Common Patterns

| Task | Command |
|------|---------|
| List tables | `sql tables --db <file>` |
| Describe table | `sql schema <table> --db <file>` |
| Sample data | `sql sample <table> --limit 10 --db <file>` |
| Export CSV | `sql query "..." --csv out.csv --db <file>` |
| Count rows | `sql query "SELECT COUNT(*) FROM <table>" --db <file>` |
| Find duplicates | `sql duplicates <table> <column> --db <file>` |

## Best Practices

1. **Use read-only mode** for exploration: `--read-only`
2. **Limit results** to avoid memory issues: `LIMIT 100`
3. **Index analysis** for slow queries: `sql indexes <table> --db <file>`
4. **Backup before modifications**: `sql backup <db> --to backup.db`

## Error Handling

- Connection failures → Check path/credentials
- Syntax errors → Validate SQL
- Permission denied → Verify user privileges
- Large results → Use `--limit` or stream output
