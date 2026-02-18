import { Transition } from '@headlessui/react';
import { Form, Head, usePage, router } from '@inertiajs/react';
import { ScanFace, Camera } from 'lucide-react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import AvatarUploadModal from '@/components/modal/avatar-upload-modal';
import FaceEnrollmentModal from '@/components/modal/face-enrollment-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import type { BreadcrumbItem, SharedData, User } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

interface ProfileProps {
    faceDescriptor?: {
        has_face: boolean;
        photo_path: string | null;
    };
}

export default function Profile({
    faceDescriptor = { has_face: false, photo_path: null },
}: ProfileProps) {
    const { auth } = usePage<SharedData>().props;

    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile Settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    {/* BAGIAN 1: PROFILE STANDARD */}
                    <Heading
                        variant="small"
                        title="Profile information"
                        description="Update your name, email address and profile picture."
                    />

                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <button
                                onClick={() => setIsAvatarModalOpen(true)}
                                className="relative w-24 h-24 rounded-full overflow-hidden bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-offset-2 hover:ring-blue-500"
                            >
                                {auth.user.avatar ? (
                                    <img
                                        src={auth.user.avatar}
                                        alt="Profile"
                                        className="w-full h-full object-cover z-10"
                                    />
                                ) : (
                                    <div className="text-white text-4xl font-bold z-10">
                                        {auth.user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all z-10" />
                                </div>
                            </button>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {auth.user.name}
                            </h3>
                            <p className="text-sm text-neutral-500">
                                Klik avatar untuk mengubah foto profil
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsAvatarModalOpen(true)}
                                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                {auth.user.avatar ? 'Update Foto' : 'Upload Foto'}
                            </button>
                        </div>
                    </div>

                    <Form
                        {...ProfileController.update.form()}
                        options={{ preserveScroll: true }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                    />
                                    <InputError className="mt-2" message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                    />
                                    <InputError className="mt-2" message={errors.email} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Save</Button>
                                    <Transition show={recentlySuccessful}>
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <div className="mt-10 pt-10 border-t border-neutral-200 dark:border-neutral-800 space-y-6">
                    <Heading
                        variant="small"
                        title="Face Recognition"
                        description="Atur data wajah untuk keperluan absensi atau login biometrik."
                    />

                    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {faceDescriptor.photo_path ? (
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-200 bg-green-50 flex items-center justify-center shadow-sm">
                                        <img
                                            src={faceDescriptor.photo_path}
                                            alt="Face"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className={`p-3 rounded-full ${faceDescriptor.has_face ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-500'}`}>
                                        <ScanFace className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {faceDescriptor.has_face ? 'Data Wajah Terdaftar' : 'Belum Ada Data Wajah'}
                                </h4>
                                <p className="text-sm text-neutral-500">
                                    {faceDescriptor.has_face
                                        ? 'Wajah Anda sudah tersimpan di sistem. Anda bisa memperbaruinya kapan saja.'
                                        : 'Tambahkan data wajah agar sistem dapat mengenali Anda.'}
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => setIsFaceModalOpen(true)}
                        >
                            {faceDescriptor.has_face ? 'Update Wajah' : 'Daftar Wajah'}
                        </Button>
                    </div>
                </div>

                <DeleteUser />

                <FaceEnrollmentModal
                    isOpen={isFaceModalOpen}
                    onClose={() => setIsFaceModalOpen(false)}
                    user={auth.user as User}
                />

                <AvatarUploadModal
                    isOpen={isAvatarModalOpen}
                    onClose={() => setIsAvatarModalOpen(false)}
                    onUploadSuccess={() => {
                        router.reload({ only: ['auth'] });
                    }}
                />

            </SettingsLayout>
        </AppLayout>
    );
}