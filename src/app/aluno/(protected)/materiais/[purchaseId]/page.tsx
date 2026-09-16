import { redirect } from 'next/navigation';

export default async function MaterialReaderPage() {
  console.log('### DRM COMPONENT MONTADO (DESATIVADO) ###');
  redirect('/cliente/dashboard');
}
