'use client';
import { useEffect,useRef,type ReactNode } from 'react';
import styles from './PurchaseRail.module.css';
/** Keep the purchase panel below the real sticky header, including its optional cart row. */
export default function PurchaseRail({children,className=''}:{children:ReactNode;className?:string}){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const header=document.querySelector<HTMLElement>('.marketplace-header');
    const update=()=>ref.current?.style.setProperty('--purchase-top',`${Math.ceil(header?.getBoundingClientRect().height||0)+16}px`);
    update();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(update):null;
    if(header)observer?.observe(header);window.addEventListener('resize',update);
    return()=>{observer?.disconnect();window.removeEventListener('resize',update);};
  },[]);
  return <div ref={ref} className={`${styles.rail} ${className}`} aria-label="Preço e opções de compra">{children}</div>;
}
