'use client';
import { calculatePaymentProcessingFee,calculatePlatformFee,CARD_PROCESSING_FEE_PERCENTAGES,PLATFORM_FEE_PERCENTAGE } from '@/lib/payment-fees';
import { WithdrawalRecord } from '@/lib/withdrawal-service';
import { DollarSign,Key,Loader2,Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function FinancialOverview(state: any) {
  const { calculatorPrice, setCalculatorPrice, calculatorInstallments, activePixKey, summary, withdrawals, withdrawalTriggerRef, setSelectedWithdrawal, formatCurrency, setCalculatorInstallments } = state;
  return <>
      {/* SEÇÃO EDUCATIVA: Entenda nossas Taxas */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Transparência Total
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Taxas claras em cada venda <span className="text-emerald-600">(sem surpresas)</span>
          </h2>
          <p className="text-slate-600 font-medium leading-relaxed max-w-3xl">
            A taxa da Educalizando é definida nas configurações da plataforma e registrada separadamente dos custos do meio de pagamento. O extrato mostra o valor bruto, cada desconto e o líquido do criador.
          </p>
        </div>

        {/* Nossa Regra (Pix) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative z-10 flex flex-col sm:flex-row gap-5 items-center">
          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-extrabold text-slate-900">Pagamento seguro: <span className="text-emerald-600">PIX, débito ou crédito em até 12x.</span></h3>
            <p className="text-sm text-slate-500 font-medium">
              A taxa da Educalizando é 13% sobre o valor original da venda. No cartão, os juros do parcelamento são pagos pelo cliente no checkout e não reduzem o saldo do criador.
            </p>
          </div>
        </div>

        {/* Calculadora de taxa */}
        <div className="relative z-10 bg-white border border-emerald-200 rounded-2xl shadow-sm p-5 sm:p-6">
          <h3 className="font-extrabold text-slate-900">Simule sua venda</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Escolha o valor e o parcelamento para confirmar quanto o cliente assume de juros e quanto fica disponível para o criador.</p>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <label className="text-xs font-bold text-slate-700">
              Valor do produto
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">R$</span>
                <input value={calculatorPrice} onChange={(e) => setCalculatorPrice(e.target.value)} inputMode="decimal" className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 font-bold outline-none focus:border-emerald-500" />
              </div>
            </label>
            <label className="text-xs font-bold text-slate-700">Parcelas no crédito<select value={calculatorInstallments} onChange={(event) => setCalculatorInstallments(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-bold outline-none focus:border-emerald-500">{Object.keys(CARD_PROCESSING_FEE_PERCENTAGES).map((value) => <option key={value} value={value}>{value}x</option>)}</select></label>
            {(() => { const gross = Math.max(0, Number(calculatorPrice.replace(',', '.')) || 0); const installments = Number(calculatorInstallments); const platformFee = calculatePlatformFee(gross); const processingFee = calculatePaymentProcessingFee(gross, 'credit_card', installments); return <>
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3"><span className="block text-xs text-rose-700 font-bold">Educalizando ({PLATFORM_FEE_PERCENTAGE}%)</span><strong className="text-lg text-rose-800">-{formatCurrency(platformFee)}</strong></div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3"><span className="block text-xs text-amber-700 font-bold">Juros pagos pelo cliente ({CARD_PROCESSING_FEE_PERCENTAGES[installments as keyof typeof CARD_PROCESSING_FEE_PERCENTAGES]}%)</span><strong className="text-lg text-amber-800">{formatCurrency(processingFee)}</strong></div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3"><span className="block text-xs text-emerald-700 font-bold">Líquido do criador</span><strong className="text-lg text-emerald-800">{formatCurrency(Math.max(0, gross - platformFee))}</strong><span className="mt-1 block text-[10px] font-bold text-emerald-700">Recebe sempre 87% do preço original</span></div>
            </>; })()}
          </div>
        </div>

        <div className="relative z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><h3 className="font-extrabold text-slate-900">Tabela completa do cartão</h3><p className="mt-1 text-xs font-medium text-slate-600">O criador paga somente 13% da Educalizando. A taxa de cada parcelamento é acrescentada ao pagamento do cliente pela InfinitePay.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-white text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Pagamento</th><th className="px-5 py-3">Taxa Educalizando</th><th className="px-5 py-3">Juros do cliente</th><th className="px-5 py-3">Desconto do criador</th><th className="px-5 py-3">Criador recebe</th></tr></thead><tbody className="divide-y divide-slate-100">{Object.entries(CARD_PROCESSING_FEE_PERCENTAGES).map(([installments, processing]) => <tr key={installments} className="hover:bg-slate-50"><td className="px-5 py-3 font-black text-slate-900">Crédito em {installments}x</td><td className="px-5 py-3 font-bold text-blue-700">13,00%</td><td className="px-5 py-3 font-bold text-amber-700">{processing.toFixed(2).replace('.', ',')}% — cliente</td><td className="px-5 py-3 font-black text-rose-700">13,00%</td><td className="px-5 py-3 font-black text-emerald-700">87,00%</td></tr>)}</tbody></table></div>
          <div className="border-t border-emerald-200 bg-emerald-50 px-5 py-4 text-xs font-semibold leading-relaxed text-emerald-900"><strong>Regra de repasse:</strong> no PIX, débito ou crédito de 1x a 12x, o criador recebe 87% do preço original. Os juros do cartão são cobrados do cliente.</div>
        </div>

        {/* Conclusão */}
        <div className="relative z-10 text-center space-y-4 max-w-2xl mx-auto pt-4">
          <p className="text-sm sm:text-base text-slate-700 font-bold">
            Consulte cada lançamento para conferir a composição exata do valor líquido disponível para saque.
          </p>
          <div className="inline-flex px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black tracking-wide uppercase shadow-md">
            Escale suas vendas e fique com o lucro de verdade!
          </div>
        </div>
      </div>

      {/* Banner / Card da Chave PIX Cadastrada */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase text-slate-500">Chave PIX Cadastrada</span>
              {activePixKey ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Validada
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Pendente
                </span>
              )}
            </div>
            <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
              {activePixKey ? `${activePixKey.pixKeyMasked} (Titular: ${activePixKey.holderName})` : 'Nenhuma chave PIX CPF cadastrada'}
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/conta"
          className="min-h-11 w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy"
        >
          {activePixKey ? 'Gerenciar Chave PIX' : 'Cadastrar Chave PIX CPF'}
        </Link>
      </div>

      {/* Resumo Transparente de Taxas Descontadas */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Detalhamento Transparente de Taxas
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Transparência total no repasse: a plataforma desconta 13%; os juros do parcelamento ficam com o cliente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Taxas Educalizando</span>
            <div className="text-lg font-black text-slate-900">{formatCurrency(summary.taxasEducalizando)}</div>
            <span className="text-[10px] text-slate-500 font-medium block">13% da plataforma em todas as vendas</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Descontos do meio de pagamento</span>
            <div className="text-lg font-black text-slate-900">{formatCurrency(summary.taxasAsaas)}</div>
            <span className="text-[10px] text-slate-500 font-medium block">Novas vendas: R$ 0,00 para o criador; juros pagos pelo cliente</span>
          </div>

          <div className="bg-rose-50/50 border border-rose-200 p-4 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase block">Total de Taxas Retidas</span>
            <div className="text-lg font-black text-rose-800">{formatCurrency(summary.totalTaxas)}</div>
            <span className="text-[10px] text-rose-600 font-medium block">Descontado do valor bruto das suas vendas</span>
          </div>
        </div>
      </div>

      {/* Histórico de Saques Realizados (Item 26 & 27 da Especificação) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Histórico de Saques PIX
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Acompanhe suas solicitações e a confirmação manual do pagamento.
            </p>
          </div>
        </div>

        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200">
            Nenhum saque solicitado até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <div className="divide-y divide-slate-100 sm:hidden">
              {withdrawals.map((wtd: WithdrawalRecord) => {
                const pending = wtd.status === 'PROCESSING' || wtd.status === 'PENDING';
                const label = wtd.status === 'COMPLETED' ? 'Concluído' : pending ? 'Em processamento' : 'Falhou';
                const className = wtd.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : pending ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-rose-100 text-rose-800 border-rose-200';
                return <button key={wtd.id} type="button" onClick={(event) => { withdrawalTriggerRef.current = event.currentTarget; setSelectedWithdrawal(wtd); }} className="w-full space-y-2 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-inset"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Solicitado em</p><p className="mt-1 text-xs font-semibold text-slate-700">{new Date(wtd.requestedAt).toLocaleString('pt-BR')}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${className}`}>{label}</span></div><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Chave PIX</p><p className="mt-1 font-mono text-xs text-slate-700">{wtd.pixKeyMasked}</p></div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Valor</p><p className="mt-1 font-mono text-sm font-black text-slate-900">{formatCurrency(wtd.amount)}</p></div></div></button>;
              })}
            </div>
            <table className="hidden w-full text-left border-collapse font-sans text-xs sm:table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Solicitado em</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Chave PIX</th>
                  <th className="py-3 px-4">Referência</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((wtd: WithdrawalRecord) => (
                  <tr
                    key={wtd.id}
                    onClick={() => setSelectedWithdrawal(wtd)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(wtd.requestedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatCurrency(wtd.amount)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {wtd.pixKeyMasked}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {wtd.paymentReference || wtd.asaasTransferId || 'Aguardando'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {wtd.status === 'COMPLETED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Concluído
                        </span>
                      ) : wtd.status === 'PROCESSING' || wtd.status === 'PENDING' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Em Processamento
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Falhou
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


  </>;
}
