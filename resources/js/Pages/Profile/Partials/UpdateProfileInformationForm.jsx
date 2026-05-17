import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                    Informasi Profil Akun
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-muted)] font-semibold">
                    Perbarui nama lengkap profil akun proktor Anda serta alamat email yang terdaftar.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6 max-w-xl">
                <div>
                    <label className="label text-xs font-semibold">Nama Lengkap</label>
                    <TextInput
                        id="name"
                        className="mt-1 block w-full input"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />
                    <InputError className="mt-2 text-danger text-xs font-semibold" message={errors.name} />
                </div>

                <div>
                    <label className="label text-xs font-semibold">Alamat Email</label>
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full input"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <InputError className="mt-2 text-danger text-xs font-semibold" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-xs text-[var(--color-text-muted)] font-semibold">
                            Alamat email Anda belum terverifikasi.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-xs text-[var(--color-accent)] underline hover:text-[var(--color-accent-hover)] focus:outline-none"
                            >
                                Klik di sini untuk mengirim ulang email verifikasi.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-xs font-bold text-[var(--color-success)]">
                                Tautan verifikasi baru telah dikirimkan ke alamat email Anda.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button type="submit" className="btn btn-primary px-5 py-2.5" disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs text-[var(--color-success)] font-bold">
                            Profil berhasil disimpan!
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
