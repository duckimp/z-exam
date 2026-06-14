import AdminLayout from '@/Layouts/AdminLayout'
import { Head } from '@inertiajs/react'
import UpdatePasswordForm from './Partials/UpdatePasswordForm'
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm'

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AdminLayout>
            <Head title="Pengaturan Profil" />

            <div className="animate-fade-in">
                <div className="page-header mb-8">
                    <div>
                        <h1 className="page-title text-2xl font-black text-[var(--color-text)]">Pengaturan Profil</h1>
                        <p className="page-desc text-sm text-[var(--color-text-muted)] mt-1">Kelola data informasi akun Anda dan ubah kata sandi.</p>
                    </div>
                </div>

                <div className="space-y-6 max-w-4xl">
                    <div className="panel bg-[var(--color-surface)] p-6 border border-[var(--color-border)] rounded-xl shadow-sm">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="w-full"
                        />
                    </div>

                    <div className="panel bg-[var(--color-surface)] p-6 border border-[var(--color-border)] rounded-xl shadow-sm">
                        <UpdatePasswordForm className="w-full" />
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
