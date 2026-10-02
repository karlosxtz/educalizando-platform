'use client';

import { AnimatePresence,motion } from 'framer-motion';
import { AlertTriangle,Loader2,Plus,Tags,X } from 'lucide-react';

interface ProductWizardDialogsProps {
  isCreatingCategory: boolean;
  setIsCreatingCategory: (open: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  handleCreateNewCategory: () => void;
  isCategoryLoading: boolean;
  showCloseConfirmation: boolean;
  setShowCloseConfirmation: (open: boolean) => void;
  confirmCancel: () => void;
}

export default function ProductWizardDialogs(props: ProductWizardDialogsProps) {
  const { isCreatingCategory, setIsCreatingCategory, newCategoryName, setNewCategoryName, handleCreateNewCategory, isCategoryLoading, showCloseConfirmation, setShowCloseConfirmation, confirmCancel } = props;
  return <>
    <AnimatePresence>
      {isCreatingCategory && <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3"><h3 className="flex items-center gap-2 text-base font-bold text-slate-900"><Tags className="h-4 w-4 text-blue-600" />Criar Nova Categoria Customizada</h3><button type="button" onClick={() => setIsCreatingCategory(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button></div>
          <div className="space-y-1.5"><label className="block text-xs font-bold uppercase text-slate-700">Nome da Categoria *</label><input type="text" value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Ex: Apostilas de Medicina 2026" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600" /><p className="text-[11px] text-slate-500">Esta categoria será exclusiva da sua loja e aparecerá apenas nos seus produtos.</p></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setIsCreatingCategory(false)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">Cancelar</button><button type="button" onClick={handleCreateNewCategory} disabled={isCategoryLoading || !newCategoryName.trim()} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">{isCategoryLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}<span>Criar Categoria</span></button></div>
        </motion.div>
      </div>}
    </AnimatePresence>
    <AnimatePresence>
      {showCloseConfirmation && <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600"><AlertTriangle className="h-6 w-6" /></div><h3 className="text-lg font-bold text-slate-900">Cancelar o cadastro do produto?</h3><p className="text-xs text-slate-500">Os dados preenchidos até agora neste produto não serão salvos.</p><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowCloseConfirmation(false)} className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200">Continuar Editando</button><button type="button" onClick={confirmCancel} className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700">Sim, Descartar</button></div></motion.div></div>}
    </AnimatePresence>
  </>;
}
