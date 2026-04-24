import { X, Monitor, Apple, Terminal, Printer, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

type OS = 'windows' | 'linux' | 'mac';

export default function PrinterSetupDrawer({ isOpen, onClose }: Props) {
    const [activeOS, setActiveOS] = useState<OS>('windows');
    const [openSection, setOpenSection] = useState<string | null>('install');

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

            {/* Drawer — kiri */}
            <div className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Printer size={14} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Setup Printer Struk</p>
                            <p className="text-xs text-gray-400">Panduan konfigurasi thermal printer</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-400 transition-colors">
                        <X size={15} />
                    </button>
                </div>

                {/* OS Tabs */}
                <div className="flex border-b border-gray-200 dark:border-zinc-800 shrink-0">
                    {([
                        { id: 'windows', label: 'Windows', icon: <Monitor size={13} /> },
                        { id: 'linux',   label: 'Linux',   icon: <Terminal size={13} /> },
                        { id: 'mac',     label: 'macOS',   icon: <Apple size={13} /> },
                    ] as { id: OS; label: string; icon: React.ReactNode }[]).map(os => (
                        <button
                            key={os.id}
                            onClick={() => { setActiveOS(os.id); setOpenSection('install'); }}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${activeOS === os.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            {os.icon} {os.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Info banner */}
                    <div className="mx-4 mt-4 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5">
                        <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                            Pastikan driver printer sudah terinstall sebelum mengikuti langkah berikut.
                            Paper size <strong>harus diset ke 80mm atau 58mm</strong> — bukan A4.
                        </p>
                    </div>

                    <div className="px-4 py-4 space-y-2">
                        {activeOS === 'windows' && <WindowsGuide openSection={openSection} setOpenSection={setOpenSection} />}
                        {activeOS === 'linux'   && <LinuxGuide   openSection={openSection} setOpenSection={setOpenSection} />}
                        {activeOS === 'mac'     && <MacGuide     openSection={openSection} setOpenSection={setOpenSection} />}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800 shrink-0">
                    <p className="text-[10px] text-gray-400 text-center">
                        Printer yang didukung: Epson TM series, Bixolon, HOIN, Xprinter, dan thermal printer kompatibel ESC/POS lainnya.
                    </p>
                </div>
            </div>
        </>
    );
}

// ── Accordion section ──────────────────────────────────────────────────────
function Section({ id, title, openSection, setOpenSection, children }: {
    id: string; title: string;
    openSection: string | null;
    setOpenSection: (id: string | null) => void;
    children: React.ReactNode;
}) {
    const isOpen = openSection === id;
    return (
        <div className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpenSection(isOpen ? null : id)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
                {title}
                {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </button>
            {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-2 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/30">
                    {children}
                </div>
            )}
        </div>
    );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
    return (
        <div className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>
        </div>
    );
}

function Code({ children }: { children: string }) {
    return (
        <code className="block bg-gray-900 text-green-400 text-[11px] font-mono px-3 py-2 rounded-lg mt-1 select-all">
            {children}
        </code>
    );
}

function Tip({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
            <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400">{children}</p>
        </div>
    );
}

// ── OS Guides ──────────────────────────────────────────────────────────────
interface GuideProps {
    openSection: string | null;
    setOpenSection: (id: string | null) => void;
}

function WindowsGuide({ openSection, setOpenSection }: GuideProps) {
    return (
        <>
            <Section id="install" title="1. Install Driver Printer" openSection={openSection} setOpenSection={setOpenSection}>
                <Step n={1}>Download driver dari website produsen printer (Epson, Bixolon, dll) atau gunakan driver generic ESC/POS.</Step>
                <Step n={2}>Jalankan installer dan ikuti wizard. Restart komputer jika diminta.</Step>
                <Tip>Untuk Epson TM series, download <strong>Epson Advanced Printer Driver (APD)</strong> dari epson.com</Tip>
            </Section>

            <Section id="papersize" title="2. Set Ukuran Kertas 80mm" openSection={openSection} setOpenSection={setOpenSection}>
                <Step n={1}>Buka <strong>Control Panel → Devices and Printers</strong> (atau tekan <kbd className="bg-gray-200 dark:bg-zinc-700 px-1 rounded text-[10px]">Win+R</kbd> → ketik <code className="text-indigo-600">control printers</code>)</Step>
                <Step n={2}>Klik kanan printer thermal → pilih <strong>Printing Preferences</strong></Step>
                <Step n={3}>Di tab <strong>Page Setup</strong> atau <strong>Paper</strong>, ubah paper size ke <strong>80mm × Roll</strong> (atau 58mm jika printer kecil)</Step>
                <Step n={4}>Klik <strong>OK</strong> dan <strong>Apply</strong></Step>
                <Tip>Jika tidak ada opsi 80mm, buat custom paper size: buka <strong>Print Server Properties</strong> → tab <strong>Forms</strong> → centang "Create a new form" → isi Width: 80mm, Height: 297mm (panjang bebas)</Tip>
            </Section>

            <Section id="browser" title="3. Setting Browser" openSection={openSection} setOpenSection={setOpenSection}>
                <Step n={1}>Saat dialog print muncul, pilih printer thermal (bukan Microsoft Print to PDF)</Step>
                <Step n={2}>Pastikan <strong>Paper size</strong> sudah 80mm Roll</Step>
                <Step n={3}>Set <strong>Margins</strong> ke <strong>None</strong> atau <strong>Minimum</strong></Step>
                <Step n={4}>Matikan <strong>Headers and footers</strong> (centang off)</Step>
                <Tip>Di Chrome: klik "More settings" untuk melihat semua opsi print</Tip>
            </Section>

            <Section id="default" title="4. Set sebagai Printer Default (opsional)" openSection={openSection} setOpenSection={setOpenSection}>
                <Step n={1}>Buka <strong>Settings → Bluetooth & devices → Printers & scanners</strong></Step>
                <Step n={2}>Klik printer thermal → pilih <strong>Set as default</strong></Step>
                <Tip>Dengan printer default, dialog print langsung memilih printer yang benar tanpa perlu pilih manual setiap kali.</Tip>
            </Section>
        </>
    );
}

function LinuxGuide({ openSection, setOpenSection }: GuideProps) {
    return (
        <>
            <Section id="install" title="1. Install CUPS & Driver" openSection={openSection} setOpenSection={setOpenSection}>
                <Step n={1}>Install CUPS (sistem print Linux):</Step>
                <Code>sudo apt install cups cups-bsd</Code>
                <Step n={2}>Untuk Epson, install driver tambahan:</Step>
                <Code>sudo apt install printer-driver-escpos</Code>
                <Step n={3}>Tambahkan user ke grup lpadmin:</Step>
                <Code>sudo usermod -aG lpadmin $USER</Code>
                <Tip>Setelah install, logout dan login kembali agar perubahan grup berlaku.</Tip>
            </Section>

            <Section id="papersize" title="2. Tambah Printer & Set 80mm" openSection={openSection} setOpenSection={setOpenSection}>
                <Step n={1}>Buka CUPS admin di browser:</Step>
                <Code>http://localhost:631</Code>
                <Step n={2}>Klik <strong>Administration → Add Printer</strong> → pilih printer thermal dari daftar</Step>
                <Step n={3}>Di bagian <strong>Set Default Options</strong>, cari <strong>Media Size</strong> → pilih <strong>80mm Roll</strong></Step>
                <Step n={4}>Atau set via terminal:</Step>
                <Code>lpoptions -p NamaPrinter -o media=Custom.80x297mm</Code>
                <Tip>Ganti <code>NamaPrinter</code> dengan nama printer yang muncul di <code>lpstat -p</code></Tip>
            </Section>

            <Section id="browser" title="3. Setting Browser" openSection={openSection} setOpenSection={setOpenSection}>
                <Step n={1}>Di dialog print Chrome/Firefox, pilih printer thermal</Step>
                <Step n={2}>Klik <strong>More settings</strong> → pastikan paper size 80mm</Step>
                <Step n={3}>Set margins ke <strong>None</strong>, matikan headers/footers</Step>
                <Tip>Di Firefox: buka <strong>about:config</strong> → cari <code>print.always_print_silent</code> → set <code>true</code> untuk skip dialog print</Tip>
            </Section>

            <Section id="rawprint" title="4. Print Langsung (tanpa dialog)" openSection={openSection} setOpenSection={setOpenSection}>
                <Step n={1}>Untuk print tanpa dialog, bisa gunakan <code>lp</code> command dari terminal:</Step>
                <Code>lp -d NamaPrinter -o media=Custom.80x297mm file.pdf</Code>
                <Tip>Cocok untuk setup kiosk atau kasir yang ingin print otomatis tanpa klik apapun.</Tip>
            </Section>
        </>
    );
}

function MacGuide({ openSection, setOpenSection }: GuideProps) {
    return (
        <>
            <Section id="install" title="1. Tambah Printer" openSection={openSection} setOpenSection={setOpenSection}>
                <Step n={1}>Hubungkan printer via USB atau pastikan terhubung ke jaringan yang sama</Step>
                <Step n={2}>Buka <strong>System Settings → Printers & Scanners</strong></Step>
                <Step n={3}>Klik tombol <strong>+</strong> → pilih printer thermal dari daftar</Step>
                <Step n={4}>macOS biasanya auto-detect driver via AirPrint atau download otomatis</Step>
                <Tip>Untuk Epson TM series, download driver dari <strong>epson.com/support</strong> jika tidak terdeteksi otomatis.</Tip>
            </Section>

            <Section id="papersize" title="2. Set Ukuran Kertas 80mm" openSection={openSection} setOpenSection={setOpenSection}>
                <Step n={1}>Buka <strong>System Settings → Printers & Scanners</strong> → klik printer → <strong>Options & Supplies</strong></Step>
                <Step n={2}>Atau saat print: klik <strong>Show Details</strong> → ubah <strong>Paper Size</strong> ke <strong>80mm Roll</strong></Step>
                <Step n={3}>Untuk buat custom size: <strong>Paper Size → Manage Custom Sizes</strong> → klik <strong>+</strong> → isi Width: 80mm, Height: 279mm</Step>
                <Tip>Simpan custom size dengan nama "Struk 80mm" agar mudah dipilih lagi.</Tip>
            </Section>

            <Section id="browser" title="3. Setting Browser (Safari/Chrome)" openSection={openSection} setOpenSection={setOpenSection}>
                <Step n={1}>Tekan <kbd className="bg-gray-200 dark:bg-zinc-700 px-1 rounded text-[10px]">⌘P</kbd> untuk print</Step>
                <Step n={2}>Pilih printer thermal, set paper size ke 80mm</Step>
                <Step n={3}>Klik <strong>Show Details</strong> → set Scale ke <strong>100%</strong>, matikan headers/footers</Step>
                <Tip>Di Chrome Mac, klik "More settings" untuk opsi lengkap termasuk margins dan headers.</Tip>
            </Section>
        </>
    );
}
