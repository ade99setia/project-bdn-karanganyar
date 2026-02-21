import { Form, Head, usePage } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import type { SharedData } from '@/types';

export default function VerifyEmail({ status }: { status?: string }) {
    const { auth } = usePage<SharedData>().props;
    
    return (
        <AuthLayout
            title="Verify your email"
            description="We've sent a verification link to your email address. Please check your inbox or spam folder."
        >
            <Head title="Email verification" />

            <div className="space-y-6">
                {status === 'verification-link-sent' && (
                    <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <p className="font-medium">Verification link sent!</p>
                        <p className="mt-1">
                            A verification link has been sent to{' '}
                            <span className="font-semibold">{auth?.user?.email}</span>
                        </p>
                    </div>
                )}

                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    <p className="font-medium mb-2">Next steps:</p>
                    <ol className="list-inside list-decimal space-y-1">
                        <li>Check your email inbox for our verification link</li>
                        <li>Click the link to verify your email address</li>
                        <li>You'll be logged in automatically after verification</li>
                    </ol>
                </div>

                <Form {...send.form()} className="space-y-4 text-center">
                    {({ processing }) => (
                        <>
                            <p className="text-xs text-muted-foreground">
                                Didn't receive the email? Check your spam folder or click below to resend.
                            </p>
                            
                            <Button disabled={processing} variant="secondary" className="w-full">
                                {processing && <Spinner />}
                                Resend verification email
                            </Button>

                            <TextLink
                                href={logout()}
                                className="mx-auto block text-sm"
                            >
                                Log out
                            </TextLink>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
