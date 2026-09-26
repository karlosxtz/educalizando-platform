import { redirect } from 'next/navigation';

export default async function LegacySellerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') params.set(key, value);
  }
  redirect(`/cadastro/produtor${params.size ? `?${params.toString()}` : ''}`);
}
