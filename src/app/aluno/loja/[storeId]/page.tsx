import StudentStorePurchasesClientView from './StudentStorePurchasesClientView';

interface StudentStorePurchasesPageProps {
  params: Promise<{
    storeId: string;
  }>;
}

export default async function StudentStorePurchasesPage({ params }: StudentStorePurchasesPageProps) {
  const { storeId } = await params;

  return (
    <StudentStorePurchasesClientView storeId={storeId} />
  );
}
