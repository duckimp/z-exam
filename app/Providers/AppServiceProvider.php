<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Rate limiter untuk login siswa (dikey berdasarkan gabungan username & IP agar tidak mengunci satu lab sekolah)
        RateLimiter::for('student_login', function (Request $request) {
            return Limit::perMinute(30)->by($request->input('username') . '|' . $request->ip());
        });

        // Rate limiter untuk simpan jawaban siswa (dikey berdasarkan student_id agar antar siswa tidak saling memblokir)
        RateLimiter::for('student_save', function (Request $request) {
            $studentId = session('student_id') ?: $request->user()?->id;
            return Limit::perMinute(120)->by($studentId ?: $request->ip());
        });
    }
}
