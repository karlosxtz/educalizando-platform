ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_affiliate_commission_type_check;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_affiliate_commission_type_check
  CHECK (affiliate_commission_type IS NULL OR affiliate_commission_type IN ('percentual', 'fixo')) NOT VALID;

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_affiliate_commission_rate_check;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_affiliate_commission_rate_check
  CHECK (affiliate_commission_rate IS NULL OR (affiliate_commission_rate >= 0 AND affiliate_commission_rate <= 100000)) NOT VALID;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_affiliate_commission_rate_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_affiliate_commission_rate_check
  CHECK (affiliate_commission_rate IS NULL OR (affiliate_commission_rate >= 0 AND affiliate_commission_rate <= 80)) NOT VALID;
