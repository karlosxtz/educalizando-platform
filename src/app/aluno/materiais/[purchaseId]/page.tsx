import MaterialReaderClientView from './MaterialReaderClientView';

interface MaterialReaderPageProps {
  params: Promise<{
    purchaseId: string;
  }>;
}

export default async function MaterialReaderPage({ params }: MaterialReaderPageProps) {
  const { purchaseId } = await params;

  return (
    <MaterialReaderClientView purchaseId={purchaseId} />
  );
}
