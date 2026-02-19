import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    ArrowRight,
    Crown,
    UserCircle2,
    Search,
    Sparkles,
    AlertCircle,
    X
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// --- TIPE DATA ---
interface Member {
    id: number;
    name: string;
    role: string;
    avatar: string | null;
}

interface Team {
    id: number;
    name: string;
    supervisor: string;
    supervisorAvatar: string | null;
    members: Member[];
    totalMembers: number;
    color: string;
    shadowColor: string;
}

interface SelectMonitoringProps {
    teams: Team[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Monitoring Teams',
        href: '#',
    },
];

export default function SelectMonitoring({ teams }: SelectMonitoringProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleTeamClick = (teamId: number) => {
        router.visit(`/supervisor/monitoring-record/${teamId}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // --- LOGIC PENCARIAN UTAMA ---
    const filteredTeams = teams.filter((team) => {
        // 1. Jika search kosong, kembalikan TRUE (tampilkan semua) agar tidak nge-bug saat delete
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase().trim();

        // 2. Cek Nama Tim, Supervisor, dan ID
        const matchBasic =
            team.name.toLowerCase().includes(query) ||
            team.supervisor.toLowerCase().includes(query) ||
            team.id.toString().toLowerCase().includes(query);

        // 3. Cek Nama ANGGOTA (Looping di dalam array members)
        const matchMembers = team.members.some(member =>
            member.name.toLowerCase().includes(query)
        );

        // 4. Return true jika salah satu kondisi terpenuhi
        return matchBasic || matchMembers;
    });

    // --- ANIMATION VARIANTS ---
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };


    return (
        <AppLayout breadcrumbs={breadcrumbs}>

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300">
                {/* Background Decoration */}
                <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -right-[10%] w-150 h-150 rounded-full bg-indigo-500/10 blur-[100px]" />
                    <div className="absolute top-[40%] -left-[10%] w-125 h-125 rounded-full bg-blue-500/10 blur-[100px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

                    {/* Header Section */}
                    <div className="text-center mb-12 space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl mb-12"
                        >
                            {/* Blob Animations */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                            <div className="relative z-10 px-8 py-12 md:py-14 text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-300 text-xs font-semibold mb-6 backdrop-blur-sm">
                                    <Sparkles size={12} />
                                    <span>MONITORING DASHBOARD V1.0</span>
                                </div>

                                <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">
                                    Cari Tim atau <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">Personil</span>
                                </h1>

                                {/* Search Bar Input */}
                                <div className="max-w-xl mx-auto relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className={`h-5 w-5 transition-colors duration-300 ${searchQuery ? 'text-indigo-400' : 'text-slate-400'}`} />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="block w-full pl-11 pr-12 py-4 bg-white/10 border border-white/10 rounded-2xl leading-5 text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-md transition-all shadow-inner font-medium"
                                        placeholder="Cari nama supervisor, sales, atau tim..."
                                    />
                                    {/* Tombol Clear (X) - Muncul jika ada text */}
                                    <AnimatePresence>
                                        {searchQuery && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                onClick={() => setSearchQuery('')}
                                                className="absolute inset-y-0 right-3 flex items-center justify-center w-8 h-8 my-auto text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
                                            >
                                                <X size={14} />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Grid Section */}
                    <motion.div
                        layout
                        className="min-h-75" // Menjaga layout tidak collapse
                    >
                        {filteredTeams.length > 0 ? (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                            >
                                <AnimatePresence mode='popLayout'>
                                    {filteredTeams.map((team) => (
                                        <motion.div
                                            key={team.id}
                                            layout
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            whileHover={{ y: -8, scale: 1.02 }}
                                            className="group cursor-pointer relative"
                                            onClick={() => handleTeamClick(team.id)}
                                        >
                                            <div className={`relative h-full bg-white dark:bg-slate-900 rounded-4xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-slate-800 ${team.shadowColor}`}>

                                                {/* Top Gradient */}
                                                <div className={`absolute top-0 left-0 right-0 h-32 bg-linear-to-br ${team.color} opacity-90`} />

                                                <div className="relative pt-10 px-6 pb-6 flex flex-col h-full">

                                                    {/* Header Card */}
                                                    <div className="relative z-10 bg-white dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700/50 mb-6">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                                                                    Supervisor ID: {team.id}
                                                                </div>
                                                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                    {team.name}
                                                                </h3>
                                                            </div>
                                                            <div className={`p-3 rounded-xl bg-linear-to-br ${team.color} text-white shadow-md`}>
                                                                <Users size={24} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 space-y-5">
                                                        {/* SUPERVISOR */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                                                <Crown size={14} className="text-amber-500" />
                                                                Supervisor
                                                            </div>
                                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-sm">
                                                                    {team.supervisor.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    {/* Highlight Supervisor jika cocok query */}
                                                                    <p className={`text-sm font-bold ${searchQuery && team.supervisor.toLowerCase().includes(searchQuery.toLowerCase()) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                        {team.supervisor}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">Supervisor Tim</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* SALES MEMBERS */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                                                <UserCircle2 size={14} />
                                                                Sales
                                                            </div>
                                                            <div className="space-y-2">
                                                                {team.members.slice(0, 2).map((member, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between text-sm px-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                                            {/* Highlight Member jika cocok query */}
                                                                            <span className={`${searchQuery && member.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded' : 'text-slate-600 dark:text-slate-300'}`}>
                                                                                {member.name}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Footer */}
                                                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                        {team.members.length > 2 && (
                                                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">
                                                                +{team.members.length - 2}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-slate-500 font-medium ml-auto">
                                                            Total <span className="text-slate-900 dark:text-white font-bold text-sm">{team.totalMembers - 1}</span> Personil
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
                                                        <button className={`w-full py-3.5 rounded-xl bg-linear-to-r ${team.color} text-white font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2`}>
                                                            Monitoring Tim <ArrowRight size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            /* Empty State */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 animate-pulse">
                                    <AlertCircle size={48} className="text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Tidak ada hasil ditemukan</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                                    Pencarian untuk "<span className="text-indigo-500 font-semibold">{searchQuery}</span>" tidak cocok dengan nama Tim, Supervisor, maupun Sales manapun.
                                </p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-medium transition-colors"
                                >
                                    Reset Pencarian
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </AppLayout>

    );
}