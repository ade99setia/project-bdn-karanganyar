import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import 'react-day-picker/dist/style.css';

interface WorkdayConfig {
    weekend_days: number[];
    holidays: string[];
    holiday_notes: Record<string, string>;
}

interface PageProps {
    workday: WorkdayConfig;
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan Hari Libur',
        href: '/settings/workday',
    },
];

const dayOptions = [
    { value: 0, label: 'Minggu' },
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
];

function toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function eachDateInRange(range: DateRange | undefined): string[] {
    if (!range?.from) return [];

    const from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
    const toRaw = range.to ?? range.from;
    const to = new Date(toRaw.getFullYear(), toRaw.getMonth(), toRaw.getDate());

    const start = from <= to ? from : to;
    const end = from <= to ? to : from;

    const keys: string[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
        keys.push(toDateString(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return keys;
}

function isSameDate(a: Date | undefined, b: Date | undefined): boolean {
    if (!a || !b) return false;
    return a.toDateString() === b.toDateString();
}

export default function WorkdaySettings() {
    const { workday, flash } = usePage<PageProps>().props;

    const [weekendDays, setWeekendDays] = useState<number[]>(workday.weekend_days || [0]);
    const [holidays, setHolidays] = useState<string[]>(workday.holidays || []);
    const [holidayNotes, setHolidayNotes] = useState<Record<string, string>>(workday.holiday_notes || {});

    // Perbaikan Logika: Set initial state ke undefined agar bersih di awal
    const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
    const [editorOpen, setEditorOpen] = useState(false);
    const [rangeNoteInput, setRangeNoteInput] = useState('');
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);

    const holidaySet = useMemo(() => new Set(holidays), [holidays]);
    const selectedRangeKeys = useMemo(() => eachDateInRange(selectedRange), [selectedRange]);
    const isRangePending = Boolean(selectedRange?.from && !selectedRange?.to);

    const selectedRangeLabel = useMemo(() => {
        if (!selectedRange?.from) return '-';
        if (!selectedRange.to) {
            return `${format(selectedRange.from, 'd MMMM yyyy', { locale: id })} (Pilih tanggal akhir)`;
        }

        const fromText = format(selectedRange.from, 'd MMMM yyyy', { locale: id });
        const toDate = selectedRange.to ?? selectedRange.from;

        if (isSameDate(selectedRange.from, toDate)) return fromText;
        return `${fromText} - ${format(toDate, 'd MMMM yyyy', { locale: id })}`;
    }, [selectedRange]);

    const selectedRangeStatus = useMemo(() => {
        if (selectedRangeKeys.length === 0) return 'Belum dipilih';
        if (isRangePending) return 'Menunggu tanggal akhir...';

        const holidayCount = selectedRangeKeys.filter((dateKey) => {
            const day = new Date(`${dateKey}T00:00:00`).getDay();
            return holidaySet.has(dateKey) || weekendDays.includes(day);
        }).length;

        if (holidayCount === selectedRangeKeys.length) return 'Hari Libur';
        if (holidayCount === 0) return 'Hari Kerja';
        return 'Campuran (Kerja & Libur)';
    }, [holidaySet, isRangePending, selectedRangeKeys, weekendDays]);

    const commonRangeNote = useMemo(() => {
        if (selectedRangeKeys.length === 0) return '';
        const notes = selectedRangeKeys.map((k) => (holidayNotes[k] ?? '').trim()).filter(Boolean);
        if (notes.length === 0) return '';
        return notes.every((note) => note === notes[0]) ? notes[0] : '';
    }, [holidayNotes, selectedRangeKeys]);

    useEffect(() => {
        setRangeNoteInput(commonRangeNote);
    }, [commonRangeNote]);

    const toggleWeekendDay = (day: number) => {
        setWeekendDays((prev) =>
            prev.includes(day) ? prev.filter((v) => v !== day) : [...prev, day].sort((a, b) => a - b)
        );
    };

    // Perbaikan Logika handleDayPick yang akurat
    const handleDayPick = (date: Date) => {
        const picked = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // Kasus 1: Mulai baru jika belum ada pilihan atau sebelumnya sudah selesai
        if (!selectedRange?.from || (selectedRange.from && selectedRange.to)) {
            setSelectedRange({ from: picked, to: undefined });
            setEditorOpen(false);
            return;
        }

        // Kasus 2: Menentukan tanggal akhir
        if (selectedRange.from && !selectedRange.to) {
            if (isSameDate(selectedRange.from, picked)) {
                setSelectedRange({ from: selectedRange.from, to: selectedRange.from });
            } else if (picked < selectedRange.from) {
                setSelectedRange({ from: picked, to: selectedRange.from });
            } else {
                setSelectedRange({ from: selectedRange.from, to: picked });
            }
            setEditorOpen(true); // Tampilkan modal
        }
    };

    const markRangeAsHoliday = () => {
        if (selectedRangeKeys.length === 0) return;
        const note = rangeNoteInput.trim();
        setHolidays((prev) => Array.from(new Set([...prev, ...selectedRangeKeys])).sort());

        if (note !== '') {
            setHolidayNotes((prev) => {
                const next = { ...prev };
                selectedRangeKeys.forEach((dateKey) => { next[dateKey] = note; });
                return next;
            });
        }
        setEditorOpen(false);
    };

    const markRangeAsWorkday = () => {
        if (selectedRangeKeys.length === 0) return;
        setHolidays((prev) => prev.filter((dateKey) => !selectedRangeKeys.includes(dateKey)));
        setHolidayNotes((prev) => {
            const next = { ...prev };
            selectedRangeKeys.forEach((dateKey) => { delete next[dateKey]; });
            return next;
        });
        setEditorOpen(false);
    };

    // Perbaikan Logika Batal: Menghapus semua highlight
    const cancelRangeSelection = () => {
        setSelectedRange(undefined);
        setRangeNoteInput('');
        setEditorOpen(false);
    };

    const handleSave = () => {
        setLoading(true);
        const sanitizedNotes = Object.entries(holidayNotes)
            .map(([date, note]) => [date, note.trim()] as const)
            .filter(([date, note]) => holidaySet.has(date) && note !== '');

        router.put('/settings/workday', {
            weekend_days: weekendDays,
            holidays,
            holiday_notes: Object.fromEntries(sanitizedNotes),
        }, {
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Hari Libur" />

            <div className="min-h-screen space-y-8 bg-blue-50/20 dark:bg-blue-950/10 pb-20 pt-8 px-4 sm:px-6 lg:px-8">
                {/* Flash Messages */}
                {(flash?.success || flash?.error || flash?.warning || flash?.info) && (
                    <div className={`rounded-xl border p-4 text-sm font-medium shadow-sm transition-all ${flash?.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300'
                        : flash?.error ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300'
                            : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                        {flash?.success || flash?.error || flash?.warning || flash?.info}
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    {/* Header Section */}
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5 dark:border-slate-800/50 dark:bg-slate-900/50">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                            <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            Kalender Kerja & Hari Libur
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Atur hari kerja rutin dan tandai tanggal spesifik untuk hari libur nasional atau cuti bersama.
                        </p>
                    </div>

                    <div className="p-6">
                        {/* Weekend Setup */}
                        <div className="mb-8">
                            <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Hari Libur Mingguan (Weekend Rutin)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {dayOptions.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleWeekendDay(day.value)}
                                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${weekendDays.includes(day.value)
                                            ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Calendar Section */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-1 dark:border-slate-800 dark:bg-slate-900/20">
                            {/* Custom Calendar Header Controls */}
                            <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setViewDate(new Date())}
                                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                                    >
                                        Hari Ini
                                    </button>
                                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {format(viewDate, 'MMMM yyyy', { locale: id })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-center bg-white py-4 dark:bg-slate-950 rounded-lg">
                                <DayPicker
                                    locale={id}
                                    mode="range"
                                    month={viewDate}
                                    onMonthChange={setViewDate}
                                    numberOfMonths={1}
                                    showOutsideDays
                                    selected={selectedRange}
                                    onDayClick={handleDayPick}
                                    modifiers={{
                                        holiday: (date) => holidaySet.has(toDateString(date)),
                                        weekend: (date) => weekendDays.includes(date.getDay()),
                                    }}
                                    classNames={{
                                        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                                        month: 'space-y-4',
                                        caption: 'hidden', // Disembunyikan karena pakai custom header
                                        table: 'w-full border-collapse space-y-1',
                                        head_row: 'flex w-full mb-3',
                                        head_cell: 'text-slate-400 dark:text-slate-500 rounded-md w-12 font-medium text-xs uppercase tracking-wider text-center',
                                        row: 'flex w-full mt-1',
                                        cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
                                        day: 'h-12 w-12 p-0 font-medium transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200',
                                        day_today: 'font-bold text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-900/50',
                                        day_outside: 'text-slate-300 dark:text-slate-600',
                                        day_range_start: 'day-range-start !bg-indigo-600 !text-white rounded-l-full rounded-r-none hover:!bg-indigo-700',
                                        day_range_end: 'day-range-end !bg-indigo-600 !text-white rounded-r-full rounded-l-none hover:!bg-indigo-700',
                                        day_range_middle: '!bg-indigo-50 !text-indigo-900 !rounded-none hover:!bg-indigo-100 dark:!bg-indigo-900/40 dark:!text-indigo-100',
                                        day_selected: '!bg-indigo-600 !text-white hover:!bg-indigo-700', // untuk kasus hari yang sama
                                    }}
                                    modifiersClassNames={{
                                        holiday: '!text-rose-600 font-semibold dark:!text-rose-400 bg-rose-50/50 dark:bg-rose-900/10 rounded-full',
                                        weekend: '!text-rose-500 dark:!text-rose-300',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-5 flex items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <div className="h-3 w-3 rounded-full bg-slate-100 border border-slate-300 dark:bg-slate-800 dark:border-slate-600"></div>
                                <span>Masuk</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <div className="h-3 w-3 rounded-full bg-rose-100 border border-rose-300 dark:bg-rose-900/50 dark:border-rose-700"></div>
                                <span>Libur</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
                                <span>Dipilih</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Save Action */}
                    <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between dark:border-slate-800/50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            * Klik dua kali pada rentang tanggal untuk mengedit.
                        </p>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 dark:focus:ring-offset-slate-900"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Perubahan Status Rentang Tanggal */}
            <Dialog
                open={editorOpen}
                onOpenChange={(isOpen) => {
                    // Jika ditutup (klik luar modal/ESC) -> Batalkan & Bersihkan kalender
                    if (!isOpen) cancelRangeSelection();
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="text-lg">Atur Tanggal Terpilih</DialogTitle>
                        <DialogDescription className="mt-1">
                            Anda memilih rentang tanggal:
                            <span className="block mt-1 font-medium text-slate-900 dark:text-white">
                                {selectedRangeLabel}
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Status Saat Ini</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{selectedRangeStatus}</span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Catatan Libur (Opsional)
                            </label>
                            <textarea
                                value={rangeNoteInput}
                                onChange={(e) => setRangeNoteInput(e.target.value)}
                                placeholder="Cth: Cuti Bersama Idul Fitri..."
                                rows={3}
                                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={cancelRangeSelection}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <X className="mr-2 h-4 w-4" /> Batal
                        </button>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={markRangeAsWorkday}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                            >
                                Jadikan Masuk
                            </button>
                            <button
                                type="button"
                                onClick={markRangeAsHoliday}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                            >
                                Jadikan Libur
                            </button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}