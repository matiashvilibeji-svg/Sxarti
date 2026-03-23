-- Restore stock function (for rollback when order creation partially fails)
CREATE OR REPLACE FUNCTION increment_stock(p_product_id uuid, p_quantity int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + p_quantity,
      updated_at = now()
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;
END;
$$;
