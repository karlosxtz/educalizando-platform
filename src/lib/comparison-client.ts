'use client';
import { useEffect,useSyncExternalStore } from 'react';
import { comparisonKey,parseComparison,type ComparisonChoice } from './material-comparison';
const storageKey='educalizando_compare_v1';const empty:ComparisonChoice[]=[];let items=empty,started=false;const listeners=new Set<()=>void>();const emit=()=>listeners.forEach(fn=>fn());
function restore(){try{items=parseComparison(localStorage.getItem(storageKey)||'');}catch{items=empty;}emit();}
export function useMaterialComparison(){const state=useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>items,()=>empty);useEffect(()=>{if(!started){started=true;restore();window.addEventListener('storage',event=>{if(event.key===storageKey)restore();});}},[]);return state;}
function save(next:ComparisonChoice[]){items=next;try{localStorage.setItem(storageKey,next.map(comparisonKey).join(','));}catch{/* Works for this tab without storage. */}emit();}
export function toggleComparison(item:ComparisonChoice){if(items.some(row=>comparisonKey(row)===comparisonKey(item))){save(items.filter(row=>comparisonKey(row)!==comparisonKey(item)));return true;}if(items.length>=3)return false;save([...items,item]);return true;}
export function clearComparison(){save([]);}
export function removeComparison(item:ComparisonChoice){save(items.filter(row=>comparisonKey(row)!==comparisonKey(item)));}
