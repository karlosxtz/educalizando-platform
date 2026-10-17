'use client';
import { useEffect } from 'react';
import { usePathname,useSearchParams } from 'next/navigation';
import { captureStoreAttribution } from '@/lib/store-webhook-contract';
export default function CampaignAttribution({storeId}:{storeId?:string}) {
  const path=usePathname(),params=useSearchParams();
  useEffect(()=>{if(storeId||!/^\/(loja|produto|dashboard|admin|aluno|cliente)(\/|$)/.test(path||''))captureStoreAttribution(storeId);},[storeId,path,params]);
  return null;
}
