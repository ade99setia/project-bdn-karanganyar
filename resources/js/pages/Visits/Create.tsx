import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

export default function VisitCreate() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [note, setNote] = useState('');

  const submit = () => {
    if (!photo) return;

    const form = new FormData();
    form.append('photo', photo);
    form.append('notes', note);

    router.post('/visits', form);
  };

  return (
    <AppLayout>
      <Head title="Visit Sales" />

      <div className="p-4 max-w-md">
        <div className="rounded-xl border p-4 space-y-4">
          <p className="font-medium">Visit Sales</p>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          />

          <textarea
            className="w-full border rounded p-2 text-sm"
            placeholder="Catatan visit"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button
            onClick={submit}
            className="w-full rounded border px-4 py-2 text-sm"
          >
            Simpan Visit
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
