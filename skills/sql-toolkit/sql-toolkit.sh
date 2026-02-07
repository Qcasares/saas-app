#!/bin/bash
# SQL Toolkit - Main script
# Usage: sql-toolkit.sh tables --db <path>

set -e

# Initialize variables
DB_PATH=""
OUTPUT_FORMAT="table"
COMMAND=""

# Parse all arguments
for ((i=1; i<=$#; i++)); do
  arg="${!i}"
  case "$arg" in
    --db)
      next=$((i+1))
      DB_PATH="${!next}"
      i=$((i+1))
      ;;
    --csv)
      OUTPUT_FORMAT="csv"
      ;;
    --json)
      OUTPUT_FORMAT="json"
      ;;
    --help|-h)
      cat << 'EOF'
SQL Toolkit - Database query tool

Usage: sql-toolkit.sh <command> --db <path> [options]

Commands:
  tables              List all tables
  schema <table>      Show table schema  
  query <sql>         Execute SQL query
  sample <table>      Sample rows (default 10)
  count <table>       Count rows

Options:
  --db <path>         Database file path
  --csv               Output as CSV
  --json              Output as JSON
EOF
      exit 0
      ;;
    -*)
      # Unknown option, skip
      ;;
    *)
      # First non-option is command
      if [[ -z "$COMMAND" ]]; then
        COMMAND="$arg"
      fi
      ;;
  esac
done

# Expand ~ to $HOME
DB_PATH="${DB_PATH/#\~/$HOME}"

# Check database
if [[ -z "$DB_PATH" ]]; then
  echo "Error: --db required"
  exit 1
fi

if [[ ! -f "$DB_PATH" ]]; then
  echo "Error: Database not found: $DB_PATH"
  exit 1
fi

# Get additional args after command
shift || true
TABLE="$1"
QUERY="$1"

# Execute command
case "$COMMAND" in
  tables)
    sqlite3 "$DB_PATH" ".tables"
    ;;
  schema)
    if [[ -z "$TABLE" ]]; then
      echo "Error: table name required"
      exit 1
    fi
    sqlite3 "$DB_PATH" ".schema $TABLE"
    ;;
  query)
    if [[ -z "$QUERY" ]]; then
      echo "Error: SQL query required"
      exit 1
    fi
    if [[ "$OUTPUT_FORMAT" == "csv" ]]; then
      sqlite3 "$DB_PATH" ".mode csv" "$QUERY"
    elif [[ "$OUTPUT_FORMAT" == "json" ]]; then
      sqlite3 "$DB_PATH" ".mode json" "$QUERY"
    else
      sqlite3 "$DB_PATH" ".headers on" ".mode column" "$QUERY"
    fi
    ;;
  sample)
    if [[ -z "$TABLE" ]]; then
      echo "Error: table name required"
      exit 1
    fi
    LIMIT="${2:-10}"
    sqlite3 "$DB_PATH" ".headers on" ".mode column" "SELECT * FROM $TABLE LIMIT $LIMIT"
    ;;
  count)
    if [[ -z "$TABLE" ]]; then
      echo "Error: table name required"
      exit 1
    fi
    sqlite3 "$DB_PATH" ".headers on" ".mode column" "SELECT COUNT(*) as count FROM $TABLE"
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo "Use --help for usage"
    exit 1
    ;;
esac
