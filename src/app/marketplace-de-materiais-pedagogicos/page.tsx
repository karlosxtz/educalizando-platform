import PublicDiscoveryPage, { discoveryMetadata, type DiscoveryParams } from '@/components/PublicDiscoveryPage';
export const revalidate = 3600;
export async function generateMetadata({ searchParams }: { searchParams: DiscoveryParams }) { return discoveryMetadata(false, searchParams); }
export default function Page({ searchParams }: { searchParams: DiscoveryParams }) { return <PublicDiscoveryPage searchParams={searchParams} />; }
