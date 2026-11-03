-- Demo database `pea_demo` with a workload that triggers the pg_stat_statements rules and metrics.
-- Needs a superuser and `shared_preload_libraries = pg_stat_statements` (see docker-compose.yml).
-- Re-runnable: drops `pea_demo` and resets pg_stat_statements for every database.
--   docker compose exec -T postgres psql -U tomato -d pea -v ON_ERROR_STOP=1 -f - < seed/pg-stat-statements.demo.sql

\set QUIET on
\pset pager off
SET client_min_messages = warning;

DROP DATABASE IF EXISTS pea_demo WITH (FORCE);
CREATE DATABASE pea_demo;
\c pea_demo

CREATE EXTENSION pg_stat_statements;

-- Schema

CREATE TABLE categories (
  id int PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE products (
  id int PRIMARY KEY,
  category_id int NOT NULL REFERENCES categories (id),
  name text NOT NULL,
  description text NOT NULL,
  price numeric(10, 2) NOT NULL
);

CREATE TABLE customers (
  id int PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL,
  country text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE orders (
  id bigint PRIMARY KEY,
  customer_id int NOT NULL REFERENCES customers (id),
  reference text NOT NULL,
  status text NOT NULL,
  priority int NOT NULL DEFAULT 0,
  coupon_code text,
  total numeric(10, 2) NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE carts (
  id int PRIMARY KEY,
  customer_id int NOT NULL,
  updated_at timestamptz NOT NULL
) WITH (autovacuum_enabled = false);

CREATE TABLE events (
  id bigserial PRIMARY KEY,
  customer_id int NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Data

INSERT INTO categories
SELECT g, 'Category ' || g FROM generate_series(1, 20) g;

INSERT INTO products
SELECT g, 1 + g % 20, (ARRAY['Red', 'Blue', 'Green', 'Black', 'White'])[1 + g % 5] || ' product ' || g, repeat(md5(g::text), 4), (random() * 500)::numeric(10, 2)
FROM generate_series(1, 2000) g;

INSERT INTO customers
SELECT g, 'user' || g || '@example.com', 'Customer ' || g, (ARRAY['VN', 'US', 'FR', 'DE', 'JP', 'KR', 'SG', 'TH', 'GB', 'AU'])[1 + g % 10], now() - g * interval '1 hour'
FROM generate_series(1, 20000) g;

INSERT INTO orders
SELECT
  g,
  1 + g % 20000,
  'ORD-' || g,
  (ARRAY['pending', 'paid', 'shipped', 'delivered', 'cancelled'])[1 + g % 5],
  0,
  CASE WHEN g % 7 = 0 THEN 'SALE' || g % 100 END,
  (random() * 1000)::numeric(10, 2),
  md5(random()::text) || repeat(md5(g::text), 3),
  now() - (g % 365) * interval '1 day'
FROM generate_series(1, 1000000) g;

INSERT INTO carts
SELECT g, 1 + g % 20000, now() FROM generate_series(1, 5000) g;

CREATE INDEX orders_customer_id_idx ON orders (customer_id);
-- Never used: UNUSED_INDEX
CREATE INDEX orders_coupon_code_idx ON orders (coupon_code);

CREATE MATERIALIZED VIEW daily_sales AS
SELECT date_trunc('day', created_at) AS day, count(*) AS orders, sum(total) AS revenue FROM orders GROUP BY 1;

CREATE FUNCTION country_customer_count(p_customer_id int) RETURNS bigint LANGUAGE plpgsql AS $$
BEGIN
  RETURN (SELECT count(*) FROM customers WHERE country = (SELECT country FROM customers WHERE id = p_customer_id));
END;
$$;

ANALYZE;

-- Drop the setup statements so only the workload below is analyzed
\o /dev/null
SELECT pg_stat_statements_reset();

-- Healthy: indexed lookup with LIMIT and explicit columns
SELECT format('SELECT id, total, status FROM orders WHERE customer_id = %s ORDER BY created_at DESC LIMIT 10', g) FROM generate_series(1, 100) g \gexec

-- SLOW_QUERY, HIGH_TOTAL_TIME_QUERY, TIME_SHARE_QUERY
SELECT 'WITH pause AS (SELECT pg_sleep(0.6)) SELECT c.country, count(*), sum(o.total) FROM pause, orders o JOIN customers c ON c.id = o.customer_id WHERE o.customer_id <= 100 GROUP BY c.country' FROM generate_series(1, 12) \gexec

-- MAX_TIME_SPIKE_QUERY, UNSTABLE_QUERY
SELECT format('WITH pause AS (SELECT pg_sleep(%s)) SELECT p.id, p.name, p.price FROM pause, products p WHERE p.id = %s', CASE WHEN g % 25 = 0 THEN 1 ELSE 0 END, g) FROM generate_series(1, 50) g \gexec

-- N_PLUS_ONE_QUERY, FREQUENT_QUERY
SELECT format('SELECT id, name, email FROM customers WHERE id = %s', g) FROM generate_series(1, 1000) g \gexec

-- LARGE_RESULT_QUERY, UNLIMITED_SELECT_QUERY
SELECT format('SELECT id, name, email FROM customers WHERE country = %L', c) FROM unnest(ARRAY['VN', 'US', 'FR', 'DE', 'JP', 'KR', 'SG', 'TH', 'GB', 'AU']) c, generate_series(1, 2) \gexec

-- SELECT_STAR_QUERY
SELECT format('SELECT * FROM products WHERE category_id = %s LIMIT 20', 1 + g % 20) FROM generate_series(1, 50) g \gexec

-- MISSING_INDEX_QUERY, DISK_READ_QUERY, LOW_CACHE_HIT_QUERY, IO_INTENSIVE_QUERY, SEQ_SCAN_RATE, LOW_CACHE_HIT_RATIO
SELECT format('SELECT id, total FROM orders WHERE reference = %L', 'ORD-' || g * 997) FROM generate_series(1, 20) g \gexec

-- OFFSET_PAGINATION_QUERY
SELECT format('SELECT id, total FROM orders ORDER BY id LIMIT 20 OFFSET %s', g * 5000) FROM generate_series(1, 30) g \gexec

-- LIKE_QUERY
SELECT format('SELECT id, name FROM products WHERE name ILIKE %L', '%' || c || '%') FROM unnest(ARRAY['red', 'blue', 'green', 'black', 'white']) c, generate_series(1, 6) \gexec

-- FUNCTION_IN_WHERE_QUERY
SELECT format('SELECT id, name FROM customers WHERE lower(email) = %L', 'user' || g || '@example.com') FROM generate_series(1, 30) g \gexec

-- ORDER_BY_RANDOM_QUERY
SELECT 'SELECT id, name FROM products ORDER BY random() LIMIT 5' FROM generate_series(1, 30) \gexec

-- LONG_IN_LIST_QUERY
SELECT format('SELECT id, name FROM products WHERE id IN (%s)', (SELECT string_agg((g + i)::text, ', ') FROM generate_series(1, 300) i)) FROM generate_series(1, 10) g \gexec

-- FREQUENT_COUNT_QUERY
SELECT format('SELECT count(*) FROM customers WHERE country = %L', (ARRAY['VN', 'US', 'FR', 'DE', 'JP'])[1 + g % 5]) FROM generate_series(1, 200) g \gexec

-- ROW_BY_ROW_INSERT_QUERY
SELECT format('INSERT INTO events (customer_id, kind) VALUES (%s, %L)', g, 'page_view') FROM generate_series(1, 500) g \gexec

-- UNFILTERED_WRITE_QUERY, DEAD_TUPLE_RATE
SELECT 'UPDATE carts SET updated_at = now()' FROM generate_series(1, 5) \gexec

-- MASS_WRITE_QUERY, DIRTIED_BUFFERS_QUERY, WRITTEN_BUFFERS_QUERY, HIGH_WAL_QUERY
SELECT format('UPDATE orders SET priority = %s WHERE customer_id <= 1000', g) FROM generate_series(1, 5) g \gexec

-- TEMP_FILE_QUERY, TEMP_FILES
SET work_mem = '64kB';
SELECT 'SELECT max(r) FROM (SELECT row_number() OVER (ORDER BY note) AS r FROM orders) t' FROM generate_series(1, 3) \gexec
RESET work_mem;

-- LOCAL_BUFFER_QUERY
CREATE TEMP TABLE report_orders AS SELECT id, customer_id, total FROM orders WHERE id <= 200000;
SELECT format('SELECT sum(total) FROM report_orders WHERE customer_id > %s', g) FROM generate_series(1, 10) g \gexec

-- HIGH_JIT_QUERY (no-op when the server has no JIT)
SET jit_above_cost = 0;
SET jit_inline_above_cost = 0;
SET jit_optimize_above_cost = 0;
SELECT format('SELECT sum(total) FROM orders WHERE customer_id = %s', g) FROM generate_series(1, 20) g \gexec
RESET jit_above_cost;
RESET jit_inline_above_cost;
RESET jit_optimize_above_cost;

-- PLAN_OVER_EXEC_QUERY, SLOW_PLANNING_QUERY
SELECT format(
  'SELECT c1.name FROM categories c1 JOIN categories c2 ON c2.id = c1.id JOIN categories c3 ON c3.id = c2.id JOIN categories c4 ON c4.id = c3.id '
  'JOIN categories c5 ON c5.id = c4.id JOIN categories c6 ON c6.id = c5.id JOIN categories c7 ON c7.id = c6.id JOIN categories c8 ON c8.id = c7.id '
  'JOIN categories c9 ON c9.id = c8.id JOIN categories c10 ON c10.id = c9.id WHERE c1.id = %s', 1 + g % 20
) FROM generate_series(1, 50) g \gexec

-- NESTED_QUERY (pg_stat_statements.track = all)
SELECT format('SELECT country_customer_count(%s)', g) FROM generate_series(1, 50) g \gexec

-- EXPENSIVE_UTILITY_COMMAND
CREATE INDEX orders_created_at_idx ON orders (created_at);
VACUUM ANALYZE orders;
REFRESH MATERIALIZED VIEW daily_sales;

\o
\echo 'pea_demo is ready: add a database connection to pea_demo and run an analysis'
