import type { Metadata } from 'next';
import IntentLandingPage from '@/components/seo/IntentLandingPage';
import { seoLandings } from '@/lib/seo-landings';
const landing = seoLandings['atividades-alfabetizacao'];
export const metadata: Metadata = { title: `${landing.title} | Educalizando`, description: landing.description, alternates: { canonical: '/atividades-alfabetizacao' } };
export default function Page() { return <IntentLandingPage landing={landing} />; }
