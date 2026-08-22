import { AffiliateWallet } from '../AffiliateWallet';

export const dynamic = 'force-dynamic';

export default function AffiliateWalletPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Carteira & Saques</h1>
          <p className="text-slate-500 mt-1">Gerencie suas comissões, saldo disponível e solicite saques para sua conta bancária.</p>
        </div>
      </div>

      <div className="mt-8">
        <AffiliateWallet />
      </div>
    </div>
  );
}
