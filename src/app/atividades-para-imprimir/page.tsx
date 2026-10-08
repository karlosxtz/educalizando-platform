import IntentLandingPage from '@/components/seo/IntentLandingPage';
import { seoLandings } from '@/lib/seo-landings';
import { pageMetadata } from '@/lib/page-seo';

const landing = seoLandings['atividades-para-imprimir'];
export function generateMetadata() { return pageMetadata('/atividades-para-imprimir'); }
export default function Page() { return <IntentLandingPage landing={landing} />; }
