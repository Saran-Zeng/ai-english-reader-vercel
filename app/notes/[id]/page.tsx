interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function NoteDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">
        Note {id}
      </h1>

      <p className="mt-4">
        AI generated learning notes.
      </p>
    </main>
  );
}