import type { Metadata } from 'next';
import IntentLandingPage from '@/components/seo/IntentLandingPage';
import { intentLandingMetadata, seoLandings } from '@/lib/seo-landings';

const landing = seoLandings['atividades-para-imprimir'];
export const metadata: Metadata = intentLandingMetadata(landing);
export default function Page() { return <IntentLandingPage landing={landing} />; }
