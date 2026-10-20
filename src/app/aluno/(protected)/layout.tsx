import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveAccountArea } from '@/lib/account-area';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getRequestUser(new Request('https://www.educalizando.com.br/cliente'));
  if (!user) redirect('/cliente/login');
  const area = await resolveAccountArea(user, supabaseAdmin);
  if (area === 'creator') redirect('/dashboard');
  return (
    <>
      {children}
    </>
  )
}
