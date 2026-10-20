BEGIN;
-- Only removes the redundant FK added by the first delivery-import migration.
-- The product FK, existing policies and transaction ownership checks stay intact.
ALTER TABLE public.platform_import_delivery_receipts
 DROP CONSTRAINT IF EXISTS platform_import_delivery_receipts_store_id_fkey;
NOTIFY pgrst,'reload schema';
COMMIT;
