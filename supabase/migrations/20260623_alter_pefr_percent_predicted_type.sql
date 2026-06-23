-- Migration: Alter pefr_percent_predicted column type in visits table to REAL
-- Date: 2026-06-23

ALTER TABLE visits 
  ALTER COLUMN pefr_percent_predicted TYPE REAL USING pefr_percent_predicted::REAL;
