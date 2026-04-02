-- Remove temporary legacy migration schemas after verification is complete.
drop schema if exists legacy_xref cascade;
drop schema if exists legacy_stage cascade;
