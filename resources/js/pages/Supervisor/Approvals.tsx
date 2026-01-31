import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

type Attendance = {
  id: number;
  user: { name: string };
  fake_gps_score: number;
};

export default function Approvals({
  attendances,
}: {
  attendances: Attendance[];
}) {
  const approve = (id: number) => {
    router.post(`/supervisor/attendance/${id}/approve`);
  };

  return (
    <AppLayout>
      <Head title="Approval Presensi" />

      <div className="p-4">
        <div className="rounded-xl border p-4">
          <p className="font-medium mb-3">Approval Presensi</p>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th>Nama</th>
                <th>Score</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((a) => (
                <tr key={a.id} className="border-t">
                  <td>{a.user.name}</td>
                  <td>{a.fake_gps_score}</td>
                  <td>
                    <button
                      onClick={() => approve(a.id)}
                      className="text-blue-600"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
