'use client';
import Link from 'next/link';
import { ArrowLeftRight,ArrowRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import styles from '@/components/teaching/CommerceExperience.module.css';
import { useMaterialComparison,clearComparison } from '@/lib/comparison-client';
import { comparisonKey } from '@/lib/material-comparison';
export default function ComparisonTray(){const items=useMaterialComparison();const pathname=usePathname();if(!items.length||pathname==='/comparar')return null;return <aside aria-label="Materiais para comparar" className={styles.tray}><span className={styles.trayIcon}><ArrowLeftRight/></span><div className={styles.trayLabel}><strong>{items.length}/3 materiais selecionados</strong><small>Compare e escolha para a sua aula</small></div><Link href={`/comparar?itens=${encodeURIComponent(items.map(comparisonKey).join(','))}`}>Comparar<ArrowRight/></Link><button type="button" onClick={clearComparison}>Limpar</button></aside>;}
