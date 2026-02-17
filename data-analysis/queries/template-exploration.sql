-- Data Exploration Template
-- Replace TABLE_NAME with your table

-- Row count
SELECT COUNT(*) as total_rows FROM TABLE_NAME;

-- Sample data
SELECT * FROM TABLE_NAME LIMIT 10;

-- Column overview (PostgreSQL)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'TABLE_NAME';

-- Null analysis
-- SELECT 
--     COUNT(*) as total,
--     SUM(CASE WHEN column_name IS NULL THEN 1 ELSE 0 END) as nulls,
--     ROUND(SUM(CASE WHEN column_name IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as null_pct
-- FROM TABLE_NAME;
