interface PurchaseLicenseSummaryProps {
  isPlr: boolean;
}

export default function PurchaseLicenseSummary({ isPlr }: PurchaseLicenseSummaryProps) {
  return (
    <div className={`rounded-2xl border p-4 ${isPlr ? 'border-purple-200 bg-purple-50' : 'border-blue-100 bg-blue-50'}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Modalidade desta compra</p>
      <p className="mt-1 text-sm font-extrabold text-slate-900">
        {isPlr ? 'Licença PLR · revenda autorizada' : 'Material para uso · sem licença de revenda'}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        {isPlr
          ? 'Confira as condições da licença do autor para saber quais alterações e formas de revenda são permitidas.'
          : 'Esta compra não inclui autorização para revender ou redistribuir os arquivos.'}
      </p>
    </div>
  );
}
