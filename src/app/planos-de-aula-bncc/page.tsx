import type { Metadata } from 'next';
import IntentLandingPage from '@/components/seo/IntentLandingPage';
import { seoLandings } from '@/lib/seo-landings';
const landing = seoLandings['planos-de-aula-bncc'];
export const metadata: Metadata = { title: `${landing.title} | Educalizando`, description: landing.description, alternates: { canonical: '/planos-de-aula-bncc' } };
export default function Page() { return <IntentLandingPage landing={landing} />; }
