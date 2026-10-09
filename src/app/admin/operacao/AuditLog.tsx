'use client';
import { useEffect, useState } from 'react';
type AuditEntry = { id: number; action: string; entity_table: string; entity_id: string; actor_user_id: string | null; created_at: string };
export default function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    void fetch('/api/admin/audit-logs', { cache: 'no-store' }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setLogs(body.logs);
    }).catch(() => setError('A auditoria ficará disponível após aplicar a migration desta atualização.'));
  }, []);
  return <section className="rounded-2xl border border-slate-700 bg-slate-950 p-5"><h2 className="text-lg font-black text-white">Histórico de alterações</h2><p className="mt-1 text-sm text-slate-400">Alterações em produtos, categorias e lojas, registradas pelo banco.</p>{error ? <p className="mt-4 text-sm text-amber-300">{error}</p> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm text-slate-300"><thead><tr><th className="py-2">Quando</th><th>Ação</th><th>Área</th><th>Registro</th></tr></thead><tbody>{logs.map(log => <tr key={log.id} className="border-t border-slate-800"><td className="whitespace-nowrap py-3 pr-3">{new Date(log.created_at).toLocaleString('pt-BR')}</td><td className="pr-3">{log.action}</td><td className="pr-3">{log.entity_table}</td><td className="font-mono text-xs">{log.entity_id}</td></tr>)}</tbody></table>{!logs.length && <p className="py-4">Nenhuma alteração registrada.</p>}</div>}</section>;
}
