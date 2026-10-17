import ClientLayout from './ClientLayout';
import { PRIVATE_METADATA } from '@/lib/private-metadata';
export const metadata = PRIVATE_METADATA;
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
