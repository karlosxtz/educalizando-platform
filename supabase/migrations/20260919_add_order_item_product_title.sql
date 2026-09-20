-- Preserva o nome exibido no momento da compra para e-mails, WhatsApp e histórico.
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_title TEXT;

-- Recupera títulos de pedidos antigos sempre que o produto ainda existir.
UPDATE public.order_items AS order_item
SET product_title = product.titulo
FROM public.products AS product
WHERE order_item.product_id::text = product.id::text
  AND (order_item.product_title IS NULL OR btrim(order_item.product_title) = '');
