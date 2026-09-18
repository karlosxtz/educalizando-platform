import type { Metadata } from 'next';
import IntentLandingPage from '@/components/seo/IntentLandingPage';
import { seoLandings } from '@/lib/seo-landings';
const landing = seoLandings['educacao-infantil'];
export const metadata: Metadata = { title: `${landing.title} | Educalizando`, description: landing.description, alternates: { canonical: '/educacao-infantil' } };
export default function Page() { return <IntentLandingPage landing={landing} />; }
