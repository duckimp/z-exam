import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                    Ubah Password Akun
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-muted)] font-semibold">
                    Pastikan akun Anda menggunakan kata sandi yang panjang dan acak demi menjaga keamanan data.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6 max-w-xl">
                <div>
                    <label className="label text-xs font-semibold">Password Saat Ini</label>
                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData('current_password', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full input"
                        autoComplete="current-password"
                    />
                    <InputError
                        message={errors.current_password}
                        className="mt-2 text-danger text-xs font-semibold"
                    />
                </div>

                <div>
                    <label className="label text-xs font-semibold">Password Baru</label>
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full input"
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password} className="mt-2 text-danger text-xs font-semibold" />
                </div>

                <div>
                    <label className="label text-xs font-semibold">Konfirmasi Password Baru</label>
                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full input"
                        autoComplete="new-password"
                    />
                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2 text-danger text-xs font-semibold"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button type="submit" className="btn btn-primary px-5 py-2.5" disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Simpan Password'}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs text-[var(--color-success)] font-bold">
                            Password berhasil diperbarui!
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
