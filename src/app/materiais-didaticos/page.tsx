import IntentLandingPage from '@/components/seo/IntentLandingPage';
import { intentLandingMetadata,seoLandings } from '@/lib/seo-landings';
import type { Metadata } from 'next';
const landing = seoLandings['materiais-didaticos'];
export const metadata: Metadata = intentLandingMetadata(landing);
export default function Page() { return <IntentLandingPage landing={landing} />; }
