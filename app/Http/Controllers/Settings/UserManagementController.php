<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    private function ensureSupervisorHierarchy(?int $supervisorEmployeeId, Role $targetRole, ?int $targetUserId = null): void
    {
        if (!$supervisorEmployeeId) {
            return;
        }

        $supervisorEmployee = Employee::query()
            ->with(['user:id,name,role_id', 'user.role:id,name,rank'])
            ->find($supervisorEmployeeId);

        if (!$supervisorEmployee || !$supervisorEmployee->user) {
            throw ValidationException::withMessages([
                'supervisor_id' => 'Pimpinan tidak valid.',
            ]);
        }

        if ($targetUserId && (int) $supervisorEmployee->user_id === (int) $targetUserId) {
            throw ValidationException::withMessages([
                'supervisor_id' => 'Pimpinan tidak boleh diri sendiri.',
            ]);
        }

        $supervisorRank = (int) ($supervisorEmployee->user?->role?->rank ?? 0);
        $targetRank = (int) ($targetRole->rank ?? 0);

        if ($supervisorRank <= $targetRank) {
            throw ValidationException::withMessages([
                'supervisor_id' => 'Pimpinan harus memiliki hirarki role lebih tinggi dari user yang dipimpin.',
            ]);
        }
    }

    private function employeeStatuses(): array
    {
        $userConfig = AppSetting::getValue('user_management', [
            'employee_statuses' => ['active', 'inactive', 'resign'],
        ]);

        $statuses = collect($userConfig['employee_statuses'] ?? ['active', 'inactive', 'resign'])
            ->map(fn($status) => trim((string) $status))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (empty($statuses)) {
            return ['active', 'inactive', 'resign'];
        }

        return $statuses;
    }

    private function authorizeAdmin(Request $request): void
    {
        // $user = $request->user();

        // if (!$user || $user->role_name !== 'admin') {
        //     abort(403, 'Hanya admin yang dapat mengakses pengaturan pengguna.');
        // }
    }

    public function index(Request $request): Response
    {
        $this->authorizeAdmin($request);

        $search = trim((string) $request->query('search', ''));
        $roleId = $request->query('role_id');
        $perPage = (int) $request->query('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;

        $usersQuery = User::query()
            ->with([
                'role:id,name,rank',
                'employee:id,user_id,status,position,division',
            ])
            ->select('id', 'name', 'email', 'phone', 'avatar', 'role_id', 'created_at', 'updated_at');

        if ($search !== '') {
            $usersQuery->where(function ($query) use ($search) {
                $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhereHas('role', function ($roleQuery) use ($search) {
                        $roleQuery->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('employee', function ($employeeQuery) use ($search) {
                        $employeeQuery
                            ->where('status', 'like', "%{$search}%")
                            ->orWhere('position', 'like', "%{$search}%")
                            ->orWhere('division', 'like', "%{$search}%");
                    });
            });
        }

        if ($roleId !== null && $roleId !== '') {
            $usersQuery->where('role_id', (int) $roleId);
        }

        $users = $usersQuery
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar,
                    'role_id' => $user->role_id,
                    'role_name' => $user->role?->name,
                    'employee_status' => $user->employee?->status,
                    'employee_position' => $user->employee?->position,
                    'employee_supervisor_id' => $user->employee?->supervisor_id,
                    'created_at' => $user->created_at?->toDateTimeString(),
                    'updated_at' => $user->updated_at?->toDateTimeString(),
                ];
            });

        $roles = Role::query()
            ->select('id', 'name', 'description', 'rank')
            ->orderBy('id')
            ->get();

        $supervisors = Employee::query()
            ->with(['user:id,name,role_id', 'user.role:id,name,rank'])
            ->whereHas('user')
            ->orderBy('id')
            ->get()
            ->map(function (Employee $employee) {
                return [
                    'employee_id' => $employee->id,
                    'user_id' => $employee->user_id,
                    'name' => $employee->user?->name,
                    'role_name' => $employee->user?->role?->name,
                    'role_rank' => (int) ($employee->user?->role?->rank ?? 0),
                ];
            })
            ->values();

        $roleCounts = User::query()
            ->selectRaw('role_id, COUNT(*) as total')
            ->whereNotNull('role_id')
            ->groupBy('role_id')
            ->pluck('total', 'role_id');

        $workdayConfig = AppSetting::getValue('workday', [
            'weekend_days' => [0],
            'holidays' => [],
        ]);

        $employeeStatuses = $this->employeeStatuses();

        return Inertia::render('settings/users', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role_id' => $roleId ? (int) $roleId : null,
                'per_page' => $perPage,
            ],
            'roles' => $roles,
            'supervisors' => $supervisors,
            'role_counts' => $roleCounts,
            'workday' => [
                'weekend_days' => array_values(array_map('intval', (array) ($workdayConfig['weekend_days'] ?? [0]))),
                'holidays' => array_values((array) ($workdayConfig['holidays'] ?? [])),
            ],
            'user_settings' => [
                'employee_statuses' => $employeeStatuses,
            ],
        ]);
    }

    public function workday(Request $request): Response
    {
        $this->authorizeAdmin($request);

        $workdayConfig = AppSetting::getValue('workday', [
            'weekend_days' => [0],
            'holidays' => [],
            'holiday_notes' => [],
        ]);

        return Inertia::render('settings/workday', [
            'workday' => [
                'weekend_days' => array_values(array_map('intval', (array) ($workdayConfig['weekend_days'] ?? [0]))),
                'holidays' => array_values((array) ($workdayConfig['holidays'] ?? [])),
                'holiday_notes' => (array) ($workdayConfig['holiday_notes'] ?? []),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $employeeStatuses = $this->employeeStatuses();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'password' => ['required', 'string', 'min:8'],
            'employee_status' => ['nullable', Rule::in($employeeStatuses)],
            'supervisor_id' => ['nullable', 'integer', 'exists:employees,id'],
        ]);

        $targetRole = Role::query()->findOrFail((int) $validated['role_id']);
        $this->ensureSupervisorHierarchy(
            isset($validated['supervisor_id']) ? (int) $validated['supervisor_id'] : null,
            $targetRole,
            null
        );

        DB::transaction(function () use ($validated) {
            $user = User::query()->create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'role_id' => $validated['role_id'],
                'password' => $validated['password'],
            ]);

            Employee::query()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'status' => $validated['employee_status'] ?? 'active',
                    'supervisor_id' => $validated['supervisor_id'] ?? null,
                ]
            );
        });

        return back()->with('success', 'User berhasil ditambahkan.');
    }

    public function storeRole(Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'description' => ['nullable', 'string', 'max:255'],
            'rank' => ['required', 'integer', 'min:0', 'max:1000'],
        ]);

        Role::query()->create([
            'name' => trim($validated['name']),
            'description' => isset($validated['description']) ? trim((string) $validated['description']) : null,
            'rank' => (int) $validated['rank'],
        ]);

        return back()->with('success', 'Role berhasil ditambahkan.');
    }

    public function updateRole(Request $request, Role $role): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name,' . $role->id],
            'description' => ['nullable', 'string', 'max:255'],
            'rank' => ['required', 'integer', 'min:0', 'max:1000'],
        ]);

        $role->name = trim($validated['name']);
        $role->description = isset($validated['description']) ? trim((string) $validated['description']) : null;
        $role->rank = (int) $validated['rank'];
        $role->save();

        return back()->with('success', 'Role berhasil diperbarui.');
    }

    public function destroyRole(Request $request, Role $role): RedirectResponse
    {
        $this->authorizeAdmin($request);

        DB::transaction(function () use ($role) {
            User::query()
                ->where('role_id', $role->id)
                ->update(['role_id' => null]);

            $role->delete();
        });

        return back()->with('success', 'Role berhasil dihapus. User terkait sementara menjadi tanpa role.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $employeeStatuses = $this->employeeStatuses();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:50'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'password' => ['nullable', 'string', 'min:8'],
            'employee_status' => ['nullable', Rule::in($employeeStatuses)],
            'supervisor_id' => ['nullable', 'integer', 'exists:employees,id'],
        ]);

        $targetRole = Role::query()->findOrFail((int) $validated['role_id']);
        $this->ensureSupervisorHierarchy(
            isset($validated['supervisor_id']) ? (int) $validated['supervisor_id'] : null,
            $targetRole,
            (int) $user->id
        );

        DB::transaction(function () use ($validated, $user) {
            $user->name = $validated['name'];
            $user->email = $validated['email'];
            $user->phone = $validated['phone'] ?? null;
            $user->role_id = $validated['role_id'];

            if (!empty($validated['password'])) {
                $user->password = $validated['password'];
            }

            $user->save();

            $employee = Employee::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'status' => $validated['employee_status'] ?? 'active',
                    'supervisor_id' => $validated['supervisor_id'] ?? null,
                ]
            );

        });

        return back()->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorizeAdmin($request);

        if ($request->user()?->id === $user->id) {
            return back()->with('error', 'Akun Anda sendiri tidak dapat dihapus.');
        }

        $user->delete();

        return back()->with('success', 'User berhasil dihapus.');
    }

    public function updateWorkday(Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'weekend_days' => ['required', 'array'],
            'weekend_days.*' => ['integer', 'between:0,6'],
            'holidays' => ['nullable', 'array'],
            'holidays.*' => ['date_format:Y-m-d'],
            'holiday_notes' => ['nullable', 'array'],
            'holiday_notes.*' => ['nullable', 'string', 'max:255'],
        ]);

        $weekendDays = collect($validated['weekend_days'])
            ->map(fn($day) => (int) $day)
            ->filter(fn($day) => $day >= 0 && $day <= 6)
            ->unique()
            ->values()
            ->all();

        $holidays = collect($validated['holidays'] ?? [])
            ->map(fn($date) => trim((string) $date))
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        $holidayNoteSource = (array) ($validated['holiday_notes'] ?? []);
        $holidayNotes = collect($holidayNoteSource)
            ->mapWithKeys(function ($note, $date) {
                return [trim((string) $date) => trim((string) $note)];
            })
            ->filter(fn($note, $date) => $date !== '' && $note !== '')
            ->only($holidays)
            ->all();

        AppSetting::setValue('workday', [
            'weekend_days' => $weekendDays,
            'holidays' => $holidays,
            'holiday_notes' => $holidayNotes,
        ], 'Konfigurasi hari kerja, weekend, dan hari libur nasional/cuti bersama.');

        return back()->with('success', 'Pengaturan hari kerja berhasil disimpan.');
    }

    public function updateUserSettings(Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'employee_statuses' => ['required', 'array', 'min:1'],
            'employee_statuses.*' => ['string', 'max:50'],
        ]);

        $employeeStatuses = collect($validated['employee_statuses'])
            ->map(fn($status) => trim((string) $status))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (empty($employeeStatuses)) {
            return back()->with('error', 'Minimal satu status pegawai harus tersedia.');
        }

        AppSetting::setValue('user_management', [
            'employee_statuses' => $employeeStatuses,
        ], 'Konfigurasi opsi status pegawai pada menu setting akun user.');

        return back()->with('success', 'Pengaturan akun user berhasil disimpan.');
    }
}
