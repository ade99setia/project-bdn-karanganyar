import { Users, Shield, UserCircle2 } from 'lucide-react';

type RoleItem = {
    id: number;
    name: string;
};

interface RoleStatsProps {
    roles: RoleItem[];
    roleCounts: Record<string, number>;
    onRoleFilter: (roleId?: number) => void;
    activeRole?: number;
}

const gradients = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-purple-500 to-fuchsia-600',
    'from-cyan-500 to-sky-600',
];

const iconByName = (name: string) => {
    const lower = name.toLowerCase();

    if (lower.includes('admin')) return Shield;
    if (lower.includes('supervisor')) return Users;

    return UserCircle2;
};

export default function RoleStatsUser({ roles, roleCounts, onRoleFilter, activeRole }: RoleStatsProps) {
    return (
        <div className="flex flex-wrap gap-3 md:justify-end">
            {roles.map((role, index) => {
                const count = roleCounts[String(role.id)] || 0;
                const isActive = typeof activeRole !== 'undefined' && activeRole === role.id;
                const Icon = iconByName(role.name);
                const gradient = gradients[index % gradients.length];

                return (
                    <button
                        key={role.id}
                        type="button"
                        disabled={count === 0}
                        onClick={() => {
                            if (isActive) {
                                onRoleFilter(undefined);
                                return;
                            }

                            onRoleFilter(role.id);
                        }}
                        className={`group relative flex h-20 w-16 flex-col items-center justify-center rounded-xl bg-linear-to-br ${gradient} text-white shadow-md transition-all duration-200 ${isActive ? 'scale-105 ring-4 ring-indigo-300/60' : 'hover:scale-105 hover:shadow-lg'} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                        <Icon className="mb-1 h-6 w-6 opacity-90" />
                        <span className="text-sm font-semibold">{count}</span>
                        <span className="pointer-events-none absolute -bottom-7 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
                            {isActive ? 'Klik untuk tampilkan semua' : role.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
