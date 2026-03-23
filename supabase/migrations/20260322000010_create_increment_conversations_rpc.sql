-- Atomically increment the monthly conversation counter for a tenant
CREATE OR REPLACE FUNCTION increment_conversations(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tenants
  SET conversations_this_month = conversations_this_month + 1,
      updated_at = now()
  WHERE id = p_tenant_id;
END;
$$;
