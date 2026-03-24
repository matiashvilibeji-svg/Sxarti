-- Add DELETE policy for delivery_zones table
-- Previously only SELECT/INSERT/UPDATE policies existed
CREATE POLICY "Users can delete own delivery zones"
  ON delivery_zones FOR DELETE
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
