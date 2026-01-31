import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Check-in', href: '#' },
];

type Gps = {
  lat: number;
  lng: number;
  accuracy: number;
};

export default function CheckIn() {
  const [gps, setGps] = useState<Gps | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => alert('GPS gagal diakses'),
      { enableHighAccuracy: true }
    );
  }, []);

  const submit = () => {
    if (!gps) return;

    setLoading(true);

    router.post('/attendance/check-in', {
      latitude: gps.lat,
      longitude: gps.lng,
      accuracy: gps.accuracy,
      is_mocked: false,
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Check-in Presensi" />

      <div className="p-4 max-w-md">
        <div className="rounded-xl border p-4 space-y-3">
          <p className="font-medium">Check-in Presensi</p>

          {!gps && (
            <p className="text-sm text-muted-foreground">
              Mengambil lokasi...
            </p>
          )}

          {gps && (
            <>
              <p className="text-sm">Akurasi GPS: {gps.accuracy} m</p>

              <button
                onClick={submit}
                disabled={loading}
                className="w-full rounded border px-4 py-2 text-sm"
              >
                {loading ? 'Mengirim...' : 'Check-in'}
              </button>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
