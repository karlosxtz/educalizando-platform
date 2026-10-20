import type { LucideIcon } from 'lucide-react';
import { AlertCircle,ArrowRight,Check,Loader2,Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './TeachingStudio.module.css';
export { styles as studioStyles };

export function StudioHero({eyebrow,title,description,icon:Icon,tag}:{eyebrow:string;title:string;description:string;icon:LucideIcon;tag:string}){
  return <header className={styles.hero}><div><span className={styles.eyebrow}>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className={styles.heroArt} aria-hidden="true"><div className={styles.orbit}><span className={styles.heroSymbol}><Icon/></span><span className={styles.floatSpark}><Sparkles size={16}/></span><span className={styles.floatTag}><Check size={12}/>{tag}</span></div></div></header>;
}
export function StudioStep({number,title,description}:{number:string;title:string;description:string}){return <div className={styles.step}><span className={styles.stepNumber}>{number}</span><div><h2>{title}</h2><p>{description}</p></div></div>;}
export function StudioEmpty({icon:Icon,title,description,children,compact=false}:{icon:LucideIcon;title:string;description:string;children?:ReactNode;compact?:boolean}){return <div className={`${styles.empty} ${compact?styles.emptyCompact:''}`}><span className={styles.icon}><Icon/></span><h3>{title}</h3><p>{description}</p>{children}</div>;}
export function StudioNotice({children,success=false}:{children:ReactNode;success?:boolean}){return <div role={success?'status':'alert'} className={`${styles.notice} ${success?styles.success:''}`}>{success?<Check/>:<AlertCircle/>}<div>{children}</div></div>;}
export function StudioLoading({children}:{children:ReactNode}){return <div role="status" className={styles.loading}><Loader2/>{children}</div>;}
export function StudioLink({href,children}:{href:string;children:ReactNode}){return <Link href={href} className={styles.secondary}>{children}<ArrowRight/></Link>;}
export function StudioToggle({checked,onChange,disabled=false,label,description}:{checked:boolean;onChange:(checked:boolean)=>void;disabled?:boolean;label:string;description?:string}){return <label className={styles.switch}><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} disabled={disabled}/><span>{label}{description&&<small>{description}</small>}</span></label>;}
