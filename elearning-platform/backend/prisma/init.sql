-- Initial database setup script
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (PostgreSQL creates the database specified in POSTGRES_DB automatically)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance (will be created by Prisma migrations, but good to have as backup)
-- These will be created by Prisma, but documented here for reference

-- Performance optimization settings
-- These are applied at the database level
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Reload configuration
SELECT pg_reload_conf();