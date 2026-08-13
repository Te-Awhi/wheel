-- Waitangi Wheel — migration 3: rōpū (intake/cohort) label on clients
-- Run once in Supabase SQL Editor (safe on the existing database).
-- Adds an optional free-text rōpū label so the dashboard can filter by intake.

alter table public.clients
  add column if not exists ropu text;
