ALTER TABLE public.wallet_transactions ADD CONSTRAINT unique_order_affiliate_commission UNIQUE (order_id, creator_id, type);
