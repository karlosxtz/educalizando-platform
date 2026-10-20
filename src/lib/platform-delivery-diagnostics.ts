// Schema-only diagnostics: never return addresses, filenames, credentials or values.
const roots = /^(downloads?|files?|attachments?|deliveries|delivery|delivery_files|delivery_url|download_url|download_link|file_url|file_link|file_path|external_url|external_link|material_url|material_link|arquivo|arquivos|arquivo_url|arquivo_link|link_entrega|link_download|link_externo|pdf|pdf_url|downloadUrl|downloadLink|fileUrl|fileLink|deliveryUrl|deliveryFiles|externalUrl|externalLink|materialUrl|materialLink|arquivoUrl)$/;
const nested = /^(url|href|src|link|file|files|download|downloads|path|name|nome|filename|file_name|fileName|title|titulo|type|tipo|mime|mimeType|mime_type|content_type|contentType|size|bytes|file_size|fileSize|id|external_url|download_url|file_url|url_download|link_download|arquivo_url|delivery_url|downloadUrl|fileUrl|externalUrl)$/;

export function platformDeliveryFields(source: Record<string, unknown>): string[] {
  const fields = new Set<string>();
  function visit(value: unknown, path: string, depth: number) {
    if (fields.size >= 60 || depth > 4) return;
    const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    fields.add(`${path}: ${type}`);
    if (Array.isArray(value)) {
      for (const item of value.slice(0, 3)) visit(item, path + '[]', depth + 1);
    } else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        if (nested.test(key)) visit(item, path + '.' + key, depth + 1);
      }
    }
  }
  for (const [key, value] of Object.entries(source)) if (roots.test(key)) visit(value, key, 0);
  return [...fields].slice(0, 60);
}
