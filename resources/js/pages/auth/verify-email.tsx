import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import type { SharedData } from '@/types';

export default function VerifyEmail({ status }: { status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const isNativeApp = Capacitor.isNativePlatform();
    const [kioskLink, setKioskLink] = useState<string | null>(null);
    const [isGeneratingKiosk, setIsGeneratingKiosk] = useState(false);
    const [kioskError, setKioskError] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(
        status === 'verification-link-sent' ? 'Verification link sent!' : null,
    );
    const [resendError, setResendError] = useState<string | null>(null);
    const [isCheckingVerification, setIsCheckingVerification] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

    async function openInBrowser() {
        if (!kioskLink) {
            setKioskError('Link auto-login belum siap, tunggu beberapa detik lalu coba lagi.');
            return;
        }

        await AppLauncher.openUrl({ url: kioskLink });
    }

    async function generateKioskLink() {
        setKioskError(null);
        setIsGeneratingKiosk(true);

        try {
            const { data } = await axios.post<{ url: string }>('/kiosk/generate-link');
            setKioskLink(data.url);
        } catch {
            setKioskError('Gagal membuat link auto-login. Silakan coba lagi.');
        } finally {
            setIsGeneratingKiosk(false);
        }
    }

    async function resendVerificationEmail() {
        setResendError(null);
        setResendMessage(null);
        setIsResending(true);

        try {
            await axios.post('/email/verification-notification/app');
            setResendMessage('Verification link sent! Please check your inbox and spam folder.');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                setResendError('Terlalu sering mengirim email verifikasi. Coba lagi dalam beberapa saat.');
            } else {
                setResendError('Gagal mengirim ulang email verifikasi. Silakan coba lagi.');
            }
        } finally {
            setIsResending(false);
        }
    }

    async function checkVerificationStatus() {
        setVerificationMessage(null);
        setIsCheckingVerification(true);

        try {
            const { data } = await axios.get<{ verified: boolean; redirect_to: string }>('/email/verification-status');

            if (data.verified) {
                window.location.href = data.redirect_to;
                return;
            }

            setVerificationMessage('Email belum terverifikasi. Silakan cek inbox dan klik link verifikasi terlebih dahulu.');
        } catch {
            setVerificationMessage('Gagal memeriksa status verifikasi. Silakan coba lagi.');
        } finally {
            setIsCheckingVerification(false);
        }
    }

    useEffect(() => {
        if (!isNativeApp) {
            return;
        }

        void generateKioskLink();
    }, [isNativeApp]);

    return (
        <AuthLayout
            title="Verify your email"
            description="We've sent a verification link to your email address. Please check your inbox or spam folder."
        >
            <Head title="Email verification" />

            <div className="space-y-6">
                {resendMessage && (
                    <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <p className="font-medium">Verification link sent!</p>
                        <p className="mt-1">
                            A verification link has been sent to <span className="font-semibold">{auth?.user?.email}</span>
                        </p>
                    </div>
                )}

                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    <p className="mb-2 font-medium">Next steps:</p>
                    <ol className="list-inside list-decimal space-y-1">
                        <li>Check your email inbox for our verification link</li>
                        <li>Click the link to verify your email address</li>
                        <li>Tap check verification status below to continue</li>
                    </ol>
                </div>

                <div className="space-y-4 text-center">
                    <p className="text-xs text-muted-foreground">
                        Didn&apos;t receive the email? Check your spam folder or click below to resend.
                    </p>

                    <Button
                        type="button"
                        disabled={isResending}
                        variant="secondary"
                        className="w-full"
                        onClick={resendVerificationEmail}
                    >
                        {isResending && <Spinner />}
                        Resend verification email
                    </Button>

                    <Button
                        type="button"
                        disabled={isCheckingVerification}
                        className="w-full"
                        onClick={checkVerificationStatus}
                    >
                        {isCheckingVerification && <Spinner />}
                        Check verification status
                    </Button>

                    {resendError && <p className="text-xs text-red-600 dark:text-red-400">{resendError}</p>}
                    {verificationMessage && (
                        <p className="text-xs text-orange-700 dark:text-orange-300">{verificationMessage}</p>
                    )}

                    <TextLink href={logout()} className="mx-auto block text-sm">
                        Log out
                    </TextLink>
                </div>

                {isNativeApp && (
                    <div className="rounded-lg bg-orange-50 p-4 text-sm text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                        <p className="font-medium">Verifikasi lewat browser (opsional)</p>
                        <p className="mt-1">
                            Jika diperlukan, Anda tetap bisa membuka browser untuk verifikasi menggunakan link auto-login.
                        </p>
                        <Button
                            type="button"
                            className="mt-3 w-full"
                            variant="secondary"
                            disabled={isGeneratingKiosk}
                            onClick={openInBrowser}
                        >
                            {isGeneratingKiosk && <Spinner />}
                            Buka auto-login di browser
                        </Button>

                        {kioskLink && (
                            <p className="mt-2 break-all text-xs text-orange-700 dark:text-orange-300">{kioskLink}</p>
                        )}

                        {kioskError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{kioskError}</p>}
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
