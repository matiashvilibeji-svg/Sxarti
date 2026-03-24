ALTER TABLE delivery_zones
  ADD COLUMN created_at timestamptz DEFAULT now();
