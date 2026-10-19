import PublicDiscoveryPage, { discoveryMetadata, type DiscoveryParams } from '@/components/PublicDiscoveryPage';
export const revalidate = 3600;
export async function generateMetadata({ searchParams }: { searchParams: DiscoveryParams }) { return discoveryMetadata(true, searchParams); }
export default function Page({ searchParams }: { searchParams: DiscoveryParams }) { return <PublicDiscoveryPage videos searchParams={searchParams} />; }
