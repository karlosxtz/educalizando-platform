import IntentLandingPage from '@/components/seo/IntentLandingPage';
import { seoLandings } from '@/lib/seo-landings';
import { pageMetadata } from '@/lib/page-seo';

const landing = seoLandings['atividades-ensino-fundamental'];
export function generateMetadata() { return pageMetadata('/atividades-ensino-fundamental'); }
export default function Page() { return <IntentLandingPage landing={landing} />; }
