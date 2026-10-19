/** Never expose database details/hints: they can contain imported values. */
export function saberImportStorageMessage(error:{code?:string}|null|undefined) {
  const code=error?.code && /^[A-Z0-9]{3,12}$/.test(error.code)?error.code:'indisponível';
  if(['42703','PGRST204'].includes(code))return 'A estrutura da importação está incompleta. Execute a correção 20261019060000_repair_platform_import_seen_ids.sql e tente novamente.';
  if(['42P01','PGRST205'].includes(code))return 'As tabelas de importação ainda não estão disponíveis. Execute a migration 20261019050000_create_platform_product_imports.sql.';
  if(['42501','PGRST301','PGRST302'].includes(code))return 'O servidor não conseguiu acessar o armazenamento da importação. A administração precisa verificar as permissões da integração; não é necessário trocar sua chave de exportação.';
  return `Não foi possível salvar a importação no banco (código ${code}). Nenhum produto desta tentativa de início foi cadastrado. Tente novamente em instantes.`;
}
