import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi Load Test
export const options = {
    // Skenario: Bertahap (Ramping VUs)
    stages: [
        { duration: '30s', target: 100 }, // Naik dari 0 ke 100 user dalam 30 detik
        { duration: '1m', target: 500 },  // Naik perlahan dari 100 ke 500 user dalam 1 menit
        { duration: '2m', target: 500 },  // Bertahan di 500 user secara bersamaan selama 2 menit
        { duration: '30s', target: 0 },   // Turun dari 500 ke 0 user dalam 30 detik
    ],
    
    // Thresholds: Ekspektasi performa server
    thresholds: {
        http_req_duration: ['p(95)<1000'], // 95% request harus selesai di bawah 1 detik (1000ms)
        http_req_failed: ['rate<0.05'],    // Tingkat error / request gagal maksimal 5%
    },
};

const BASE_URL = 'http://192.168.0.111:8000';

export default function () {
    // Skenario 1: Akses Halaman Awal / Login Siswa
    // Mensimulasikan 500 user membuka halaman depan ujian
    let res = http.get(`${BASE_URL}/`);
    
    check(res, {
        'Halaman login terbuka (status 200)': (r) => r.status === 200,
    });
    
    // Jeda sejenak untuk mensimulasikan user membaca/mengetik (think time)
    sleep(Math.random() * 2 + 1); // sleep antara 1-3 detik

    // ---------------------------------------------------------
    // Skenario Lanjutan (Opsional): Simulasi Login (POST request)
    // Jika ingin test sampai login, hilangkan komentar di bawah.
    // Pastikan Anda menangani CSRF Token bawaan Laravel di load test jika dibutuhkan.
    // ---------------------------------------------------------
    
    /*
    const csrfToken = res.html().find('meta[name="csrf-token"]').attr('content');
    
    let loginData = {
        nis: `siswa_test_${__VU}`, // Menggunakan Virtual User ID sebagai NIS fiktif
        password: 'password',
        _token: csrfToken // Token CSRF Laravel
    };
    
    let loginRes = http.post(`${BASE_URL}/student/login`, loginData);
    
    check(loginRes, {
        'Berhasil login (status 200/302)': (r) => r.status === 200 || r.status === 302,
    });
    
    sleep(1);
    */
}
