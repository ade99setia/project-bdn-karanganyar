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

interface TargetConfig {
    default_daily_target: number;
    default_daily_delivery_target?: number;
    daily_targets: Record<string, number>;
}

interface PageProps {
    workday: WorkdayConfig;
    target: TargetConfig;
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

function formatDateKey(dateKey: string): string {
    const parsed = new Date(`${dateKey}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return dateKey;
    return format(parsed, 'd MMM yyyy', { locale: id });
}

export default function WorkdaySettings() {
    const { workday, target, flash } = usePage<PageProps>().props;

    const [weekendDays, setWeekendDays] = useState<number[]>(workday.weekend_days || [0]);
    const [holidays, setHolidays] = useState<string[]>(workday.holidays || []);
    const [holidayNotes, setHolidayNotes] = useState<Record<string, string>>(workday.holiday_notes || {});
    const [defaultDailyTarget, setDefaultDailyTarget] = useState<number>(target.default_daily_target ?? 8);
    const [defaultDailyDeliveryTarget, setDefaultDailyDeliveryTarget] = useState<number>(target.default_daily_delivery_target ?? 0);
    const [dailyTargets, setDailyTargets] = useState<Record<string, number>>(target.daily_targets || {});

    // Perbaikan Logika: Set initial state ke undefined agar bersih di awal
    const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorMode, setEditorMode] = useState<'holiday' | 'target'>('holiday');
    const [interactionMode, setInteractionMode] = useState<'view' | 'edit'>('view');
    const [rangeNoteInput, setRangeNoteInput] = useState('');
    const [rangeTargetInput, setRangeTargetInput] = useState('');
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);

    const holidaySet = useMemo(() => new Set(holidays), [holidays]);
    const targetDateSet = useMemo(() => new Set(Object.keys(dailyTargets)), [dailyTargets]);
    const selectedRangeKeys = useMemo(() => eachDateInRange(selectedRange), [selectedRange]);
    const selectedRangeKeySet = useMemo(() => new Set(selectedRangeKeys), [selectedRangeKeys]);
    const isRangePending = Boolean(selectedRange?.from && !selectedRange?.to);

    const sortedHolidayDates = useMemo(() => [...holidays].sort((a, b) => a.localeCompare(b)), [holidays]);
    const sortedTargetEntries = useMemo(
        () => Object.entries(dailyTargets).sort(([a], [b]) => a.localeCompare(b)),
        [dailyTargets]
    );
    const activeMonthLabel = useMemo(() => format(viewDate, 'MMMM yyyy', { locale: id }), [viewDate]);
    const activeMonthPrefix = useMemo(
        () => `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`,
        [viewDate]
    );
    const holidaysInActiveMonth = useMemo(
        () => sortedHolidayDates.filter((dateKey) => dateKey.startsWith(`${activeMonthPrefix}-`)),
        [activeMonthPrefix, sortedHolidayDates]
    );
    const targetEntriesInActiveMonth = useMemo(
        () => sortedTargetEntries.filter(([dateKey]) => dateKey.startsWith(`${activeMonthPrefix}-`)),
        [activeMonthPrefix, sortedTargetEntries]
    );

    const selectedRangeHolidayCount = useMemo(() => {
        return selectedRangeKeys.filter((dateKey) => {
            const day = new Date(`${dateKey}T00:00:00`).getDay();
            return holidaySet.has(dateKey) || weekendDays.includes(day);
        }).length;
    }, [holidaySet, selectedRangeKeys, weekendDays]);

    const selectedRangeWorkdayCount = useMemo(
        () => Math.max(0, selectedRangeKeys.length - selectedRangeHolidayCount),
        [selectedRangeHolidayCount, selectedRangeKeys.length]
    );

    const selectedTargetValues = useMemo(() => {
        return selectedRangeKeys.map((dateKey) => {
            const day = new Date(`${dateKey}T00:00:00`).getDay();
            const isHoliday = holidaySet.has(dateKey) || weekendDays.includes(day);
            const value = Number.isInteger(dailyTargets[dateKey])
                ? Math.max(0, Number(dailyTargets[dateKey]))
                : (isHoliday ? 0 : Math.max(0, defaultDailyTarget));

            return {
                dateKey,
                value,
                hasSpecialTarget: Number.isInteger(dailyTargets[dateKey]),
            };
        });
    }, [dailyTargets, defaultDailyTarget, holidaySet, selectedRangeKeys, weekendDays]);

    const selectedRangeTargetSummary = useMemo(() => {
        if (selectedTargetValues.length === 0) {
            return {
                effectivePerDayLabel: '-',
                totalTarget: 0,
                sourceLabel: '-',
            };
        }

        const values = selectedTargetValues.map((item) => item.value);
        const uniqueValues = Array.from(new Set(values));
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const totalTarget = values.reduce((sum, value) => sum + value, 0);
        const specialCount = selectedTargetValues.filter((item) => item.hasSpecialTarget).length;

        const effectivePerDayLabel = uniqueValues.length === 1
            ? `${uniqueValues[0]}`
            : `Bervariasi (${minValue} - ${maxValue})`;

        let sourceLabel = `Default ${defaultDailyTarget}`;
        if (specialCount > 0 && specialCount === selectedTargetValues.length) {
            sourceLabel = 'Semua dari target khusus';
        } else if (specialCount > 0) {
            sourceLabel = `${specialCount} tanggal pakai target khusus`;
        }

        return {
            effectivePerDayLabel,
            totalTarget,
            sourceLabel,
        };
    }, [defaultDailyTarget, selectedTargetValues]);

    const selectedHolidayNoteSummary = useMemo(() => {
        if (selectedRangeKeys.length === 0) return '-';
        if (selectedRangeHolidayCount === 0) return 'Bukan hari libur';

        const notes = selectedRangeKeys
            .map((dateKey) => (holidayNotes[dateKey] ?? '').trim())
            .filter(Boolean);

        if (notes.length === 0) return 'Libur (tanpa catatan)';
        const unique = Array.from(new Set(notes));
        if (unique.length === 1) return unique[0];

        return `Catatan libur bervariasi (${unique.length} catatan)`;
    }, [holidayNotes, selectedRangeHolidayCount, selectedRangeKeys]);

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

    const commonRangeTarget = useMemo(() => {
        if (selectedRangeKeys.length === 0) return '';
        const targets = selectedRangeKeys
            .map((dateKey) => dailyTargets[dateKey])
            .filter((target): target is number => Number.isInteger(target));

        if (targets.length === 0) return '';
        return targets.every((target) => target === targets[0]) ? String(targets[0]) : '';
    }, [dailyTargets, selectedRangeKeys]);

    const changeSummary = useMemo(() => {
        const initialWeekend = new Set((workday.weekend_days || []).map((day) => Number(day)));
        const currentWeekend = new Set((weekendDays || []).map((day) => Number(day)));

        const weekendChanged =
            initialWeekend.size !== currentWeekend.size
            || [...initialWeekend].some((day) => !currentWeekend.has(day));

        const initialHolidays = [...(workday.holidays || [])].sort((a, b) => a.localeCompare(b));
        const currentHolidays = [...holidays].sort((a, b) => a.localeCompare(b));
        const initialHolidaySet = new Set(initialHolidays);
        const currentHolidaySet = new Set(currentHolidays);

        const holidaysAdded = currentHolidays.filter((dateKey) => !initialHolidaySet.has(dateKey));
        const holidaysRemoved = initialHolidays.filter((dateKey) => !currentHolidaySet.has(dateKey));

        const initialNotes = workday.holiday_notes || {};
        const changedHolidayNotes = currentHolidays.filter((dateKey) => {
            const current = (holidayNotes[dateKey] || '').trim();
            const before = (initialNotes[dateKey] || '').trim();
            return current !== before;
        }).length;

        const defaultTargetChanged = Math.max(0, Math.floor(defaultDailyTarget || 0))
            !== Math.max(0, Math.floor(target.default_daily_target || 0));

        const defaultDeliveryTargetChanged = Math.max(0, Math.floor(defaultDailyDeliveryTarget || 0))
            !== Math.max(0, Math.floor(target.default_daily_delivery_target || 0));

        const normalizeTargets = (source: Record<string, number>) =>
            Object.entries(source || {}).reduce<Record<string, number>>((carry, [dateKey, rawValue]) => {
                const key = dateKey.trim();
                if (!key) return carry;
                carry[key] = Math.max(0, Math.floor(Number.isFinite(rawValue) ? rawValue : 0));
                return carry;
            }, {});

        const initialTargets = normalizeTargets(target.daily_targets || {});
        const currentTargets = normalizeTargets(dailyTargets);
        const mergedTargetKeys = Array.from(new Set([...Object.keys(initialTargets), ...Object.keys(currentTargets)]));
        const changedTargetDates = mergedTargetKeys.filter((dateKey) => (initialTargets[dateKey] ?? null) !== (currentTargets[dateKey] ?? null));

        const changes: string[] = [];
        if (weekendChanged) changes.push('Weekend rutin berubah.');
        if (holidaysAdded.length > 0) changes.push(`Tambah hari libur: ${holidaysAdded.length} tanggal.`);
        if (holidaysRemoved.length > 0) changes.push(`Hapus hari libur: ${holidaysRemoved.length} tanggal.`);
        if (changedHolidayNotes > 0) changes.push(`Catatan libur diubah: ${changedHolidayNotes} tanggal.`);
        if (defaultTargetChanged) changes.push('Target harian default diubah.');
        if (defaultDeliveryTargetChanged) changes.push('Target harian pengiriman diubah.');
        if (changedTargetDates.length > 0) changes.push(`Target khusus diubah: ${changedTargetDates.length} tanggal.`);

        return {
            weekendChanged,
            holidaysAdded,
            holidaysRemoved,
            changedHolidayNotes,
            defaultTargetChanged,
            defaultDeliveryTargetChanged,
            changedTargetDates,
            hasChanges: changes.length > 0,
            totalChanges: changes.length,
            lines: changes,
        };
    }, [dailyTargets, defaultDailyDeliveryTarget, defaultDailyTarget, holidayNotes, holidays, target.daily_targets, target.default_daily_delivery_target, target.default_daily_target, weekendDays, workday.holiday_notes, workday.holidays, workday.weekend_days]);

    useEffect(() => {
        setRangeNoteInput(commonRangeNote);
    }, [commonRangeNote]);

    useEffect(() => {
        setRangeTargetInput(commonRangeTarget);
    }, [commonRangeTarget]);

    useEffect(() => {
        setEditorOpen(false);

        if (interactionMode === 'view') {
            setSelectedRange((prev) => {
                if (!prev?.from || prev?.to) return prev;
                return { from: prev.from, to: prev.from };
            });
            return;
        }

        setSelectedRange(undefined);
    }, [interactionMode]);

    const toggleWeekendDay = (day: number) => {
        setWeekendDays((prev) =>
            prev.includes(day) ? prev.filter((v) => v !== day) : [...prev, day].sort((a, b) => a - b)
        );
    };

    const handleDayPick = (date: Date) => {
        const picked = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (interactionMode === 'view') {
            setSelectedRange({ from: picked, to: picked });
            setEditorOpen(false);
        }
    };

    const handleRangeSelect = (range: DateRange | undefined) => {
        if (interactionMode !== 'edit') return;

        if (!range?.from) {
            setSelectedRange(undefined);
            setEditorOpen(false);
            return;
        }

        const isSingleDayRange = !!range.to && isSameDate(range.from, range.to);
        const canFinalizeSingleDay = Boolean(
            selectedRange?.from
            && !selectedRange?.to
            && isSameDate(selectedRange.from, range.from)
        );

        const normalizedRange: DateRange = isSingleDayRange && !canFinalizeSingleDay
            ? { from: range.from, to: undefined }
            : range;

        setSelectedRange(normalizedRange);

        if (normalizedRange.from && normalizedRange.to) {
            setEditorMode('holiday');
            setEditorOpen(true);
            return;
        }

        setEditorOpen(false);
    };

    const markRangeAsHoliday = () => {
        if (selectedRangeKeys.length === 0) return;
        const note = rangeNoteInput.trim();
        if (note === '') return;

        setHolidays((prev) => Array.from(new Set([...prev, ...selectedRangeKeys])).sort());

        setHolidayNotes((prev) => {
            const next = { ...prev };
            selectedRangeKeys.forEach((dateKey) => { next[dateKey] = note; });
            return next;
        });

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

    const saveRangeTargetOnly = () => {
        if (selectedRangeKeys.length === 0) return;
        if (rangeTargetInput.trim() === '') return;

        const parsedTarget = Math.max(0, Number.parseInt(rangeTargetInput, 10) || 0);
        setDailyTargets((prev) => {
            const next = { ...prev };
            selectedRangeKeys.forEach((dateKey) => {
                next[dateKey] = parsedTarget;
            });
            return next;
        });
        setEditorOpen(false);
    };

    const clearRangeTargetOnly = () => {
        if (selectedRangeKeys.length === 0) return;

        setDailyTargets((prev) => {
            const next = { ...prev };
            selectedRangeKeys.forEach((dateKey) => {
                delete next[dateKey];
            });
            return next;
        });
        setEditorOpen(false);
    };

    // Perbaikan Logika Batal: Menghapus semua highlight
    const cancelRangeSelection = () => {
        setSelectedRange(undefined);
        setEditorMode('holiday');
        setRangeNoteInput('');
        setRangeTargetInput('');
        setEditorOpen(false);
    };

    const handleSave = () => {
        setLoading(true);
        const sanitizedNotes = Object.entries(holidayNotes)
            .map(([date, note]) => [date, note.trim()] as const)
            .filter(([date, note]) => holidaySet.has(date) && note !== '');

        const sanitizedDailyTargets = Object.entries(dailyTargets)
            .map(([date, target]) => [date.trim(), Number.isFinite(target) ? Math.max(0, Math.floor(target)) : 0] as const)
            .filter(([date]) => date !== '');

        router.put('/settings/workday', {
            weekend_days: weekendDays,
            holidays,
            holiday_notes: Object.fromEntries(sanitizedNotes),
            default_daily_target: Math.max(0, Math.floor(defaultDailyTarget || 0)),
            default_daily_delivery_target: Math.max(0, Math.floor(defaultDailyDeliveryTarget || 0)),
            daily_targets: Object.fromEntries(sanitizedDailyTargets),
        }, {
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    };

    const dayPickerModifiers = {
        holiday: (date: Date) => holidaySet.has(toDateString(date)),
        weekend: (date: Date) => weekendDays.includes(date.getDay()),
        targetDay: (date: Date) => targetDateSet.has(toDateString(date)),
        editingRange: (date: Date) => selectedRangeKeySet.has(toDateString(date)),
    };

    const dayPickerClassNames = {
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'hidden',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex w-full mb-3',
        head_cell: 'text-slate-400 dark:text-slate-500 rounded-md w-12 font-medium text-xs uppercase tracking-wider text-center',
        row: 'flex w-full mt-1',
        cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
        day: 'relative h-12 w-12 p-0 font-medium transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200',
        day_today: 'font-bold text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-900/50',
        day_outside: 'text-slate-300 dark:text-slate-600',
        day_range_start: 'day-range-start !bg-indigo-600 !text-white rounded-l-full rounded-r-none hover:!bg-indigo-700',
        day_range_end: 'day-range-end !bg-indigo-600 !text-white rounded-r-full rounded-l-none hover:!bg-indigo-700',
        day_range_middle: '!bg-indigo-50 !text-indigo-900 !rounded-none hover:!bg-indigo-100 dark:!bg-indigo-900/40 dark:!text-indigo-100',
        day_selected: '!bg-indigo-600 !text-white hover:!bg-indigo-700',
    };

    const dayPickerModifiersClassNames = {
        holiday: '!text-rose-600 font-semibold dark:!text-rose-400 bg-rose-50/50 dark:bg-rose-900/10 rounded-full',
        weekend: '!text-rose-500 dark:!text-rose-300',
        targetDay: 'ring-1 ring-orange-400/70 dark:ring-orange-500/80',
        editingRange: 'ring-2 ring-indigo-300 dark:ring-indigo-500',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Hari Libur" />

            <div className="min-h-screen space-y-8 bg-blue-50/20 dark:bg-blue-950/10 pb-20 pt-8 px-4 sm:px-6 lg:px-8 md:max-w-5xl md:mx-auto">
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

                        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Target Total Harian Default (kunjungan + pengiriman, per sales)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={defaultDailyTarget}
                                        onChange={(event) => setDefaultDailyTarget(Math.max(0, Number.parseInt(event.target.value || '0', 10) || 0))}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Minimal Target Pengiriman Harian (per sales)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={defaultDailyDeliveryTarget}
                                        onChange={(event) => setDefaultDailyDeliveryTarget(Math.max(0, Number.parseInt(event.target.value || '0', 10) || 0))}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Target total bisa dioverride per tanggal/rentang lewat kalender. Syarat performa penuh: target total tercapai dan pengiriman minimal juga tercapai.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                            <div>
                                <div className="mb-4 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
                                    <div className="grid grid-cols-2 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setInteractionMode('view')}
                                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${interactionMode === 'view'
                                                ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            Cek Detail Hari
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInteractionMode('edit')}
                                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${interactionMode === 'edit'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            Input / Edit Rentang
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-1 dark:border-slate-800 dark:bg-slate-900/20">
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
                                                {activeMonthLabel}
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

                                    <div className="flex justify-center rounded-lg bg-white py-4 dark:bg-slate-950">
                                        {interactionMode === 'view' ? (
                                            <DayPicker
                                                locale={id}
                                                mode="single"
                                                month={viewDate}
                                                onMonthChange={setViewDate}
                                                numberOfMonths={1}
                                                showOutsideDays
                                                selected={selectedRange?.from}
                                                onDayClick={handleDayPick}
                                                modifiers={dayPickerModifiers}
                                                classNames={dayPickerClassNames}
                                                modifiersClassNames={dayPickerModifiersClassNames}
                                            />
                                        ) : (
                                            <DayPicker
                                                locale={id}
                                                mode="range"
                                                month={viewDate}
                                                onMonthChange={setViewDate}
                                                numberOfMonths={1}
                                                showOutsideDays
                                                selected={selectedRange}
                                                onSelect={handleRangeSelect}
                                                modifiers={dayPickerModifiers}
                                                classNames={dayPickerClassNames}
                                                modifiersClassNames={dayPickerModifiersClassNames}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <div className="h-3 w-3 rounded-full border border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"></div>
                                        <span>Masuk</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <div className="h-3 w-3 rounded-full border border-rose-300 bg-rose-100 dark:border-rose-700 dark:bg-rose-900/50"></div>
                                        <span>Libur</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <div className="h-3 w-3 rounded-full border border-orange-300 bg-orange-100 dark:border-orange-700 dark:bg-orange-900/40"></div>
                                        <span>Target Khusus</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
                                        <span>Sedang Diedit</span>
                                    </div>
                                </div>
                            </div>

                            <aside className="space-y-4">
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                                        Tanggal Aktif Dipilih
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{selectedRangeLabel}</p>
                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Status: {selectedRangeStatus}</p>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        Mode: {interactionMode === 'view' ? 'Cek detail (klik 1 tanggal)' : 'Input/Edit (klik rentang tanggal)'}
                                    </p>

                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <div className="rounded-lg border border-white/70 bg-white/70 p-2 dark:border-slate-800 dark:bg-slate-900/60">
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Tanggal</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedRangeKeys.length}</p>
                                        </div>
                                        <div className="rounded-lg border border-white/70 bg-white/70 p-2 dark:border-slate-800 dark:bg-slate-900/60">
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Hari Kerja</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedRangeWorkdayCount}</p>
                                        </div>
                                        <div className="rounded-lg border border-white/70 bg-white/70 p-2 dark:border-slate-800 dark:bg-slate-900/60">
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Hari Libur</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedRangeHolidayCount}</p>
                                        </div>
                                        <div className="rounded-lg border border-white/70 bg-white/70 p-2 dark:border-slate-800 dark:bg-slate-900/60">
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Target Berlaku / Hari</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedRangeTargetSummary.effectivePerDayLabel}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-2 rounded-lg border border-white/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Total target rentang</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">{selectedRangeTargetSummary.totalTarget}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Sumber target</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{selectedRangeTargetSummary.sourceLabel}</span>
                                        </div>
                                        <div className="flex items-start justify-between gap-3 text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Keterangan libur</span>
                                            <span className="text-right font-medium text-slate-700 dark:text-slate-200">{selectedHolidayNoteSummary}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        Ringkasan Bulan Aktif ({activeMonthLabel})
                                    </p>

                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Hari libur khusus</p>
                                            {holidaysInActiveMonth.length === 0 ? (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tidak ada di bulan ini.</p>
                                            ) : (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {holidaysInActiveMonth.slice(0, 8).map((dateKey) => (
                                                        <span
                                                            key={dateKey}
                                                            className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-900/70 dark:bg-rose-900/20 dark:text-rose-300"
                                                        >
                                                            {formatDateKey(dateKey)}
                                                        </span>
                                                    ))}
                                                    {holidaysInActiveMonth.length > 8 && (
                                                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                                            +{holidaysInActiveMonth.length - 8} lainnya
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Target khusus per tanggal</p>
                                            {targetEntriesInActiveMonth.length === 0 ? (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tidak ada di bulan ini.</p>
                                            ) : (
                                                <div className="mt-2 space-y-1.5">
                                                    {targetEntriesInActiveMonth.slice(0, 6).map(([dateKey, value]) => (
                                                        <div
                                                            key={dateKey}
                                                            className="flex items-center justify-between rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[11px] dark:border-orange-900/60 dark:bg-orange-900/20"
                                                        >
                                                            <span className="font-medium text-orange-700 dark:text-orange-300">{formatDateKey(dateKey)}</span>
                                                            <span className="font-semibold text-orange-800 dark:text-orange-200">{value}</span>
                                                        </div>
                                                    ))}
                                                    {targetEntriesInActiveMonth.length > 6 && (
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            +{targetEntriesInActiveMonth.length - 6} target khusus lain di bulan ini.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Ringkasan Perubahan Belum Disimpan</p>
                            {!changeSummary.hasChanges ? (
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Belum ada perubahan dari konfigurasi sebelumnya.</p>
                            ) : (
                                <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                    {changeSummary.lines.map((line) => (
                                        <li key={line}>• {line}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Footer / Save Action */}
                    <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:flex-row sm:items-center sm:px-6 dark:border-slate-800/50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {interactionMode === 'view'
                                ? '* Mode cek detail: klik 1 tanggal untuk melihat status, target, dan keterangan libur.'
                                : '* Mode input/edit: klik 2 tanggal untuk pilih rentang, atur di modal, lalu simpan semua perubahan.'}
                        </p>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loading || !changeSummary.hasChanges}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 dark:focus:ring-offset-slate-900"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {changeSummary.hasChanges
                                ? `Simpan ${changeSummary.totalChanges} Perubahan`
                                : 'Tidak Ada Perubahan'}
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
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
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
                        <div className="rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                            <div className="grid grid-cols-2 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setEditorMode('holiday')}
                                    className={`rounded-md px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${editorMode === 'holiday'
                                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                                        : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700/60'
                                        }`}
                                >
                                    Atur Hari Libur
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditorMode('target')}
                                    className={`rounded-md px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${editorMode === 'target'
                                        ? 'bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-400'
                                        : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700/60'
                                        }`}
                                >
                                    Atur Target
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Status Saat Ini</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{selectedRangeStatus}</span>
                        </div>

                        {editorMode === 'holiday' ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Catatan Libur (Wajib)
                                </label>
                                <textarea
                                    value={rangeNoteInput}
                                    onChange={(e) => setRangeNoteInput(e.target.value)}
                                    placeholder="Wajib diisi. Cth: Cuti Bersama Idul Fitri"
                                    rows={3}
                                    required
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Target Khusus Rentang (Wajib)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={rangeTargetInput}
                                    onChange={(event) => setRangeTargetInput(event.target.value)}
                                    placeholder="Wajib diisi. Contoh: 8"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between dark:border-slate-800">
                        <button
                            type="button"
                            onClick={cancelRangeSelection}
                            className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <X className="mr-2 h-4 w-4" /> Batal
                        </button>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            {editorMode === 'holiday' ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={markRangeAsWorkday}
                                        className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-emerald-600 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                                    >
                                        Jadikan Masuk
                                    </button>
                                    <button
                                        type="button"
                                        onClick={markRangeAsHoliday}
                                        disabled={rangeNoteInput.trim() === ''}
                                        className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                    >
                                        Jadikan Libur
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={clearRangeTargetOnly}
                                        className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        Hapus Target Khusus
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveRangeTargetOnly}
                                        disabled={rangeTargetInput.trim() === ''}
                                        className="inline-flex w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                    >
                                        Simpan Target
                                    </button>
                                </>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}