<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $keys = [
            ['key' => 'kepala_sekolah_nama', 'value' => '',    'group' => 'kartu_ujian'],
            ['key' => 'kepala_sekolah_nip',  'value' => '',    'group' => 'kartu_ujian'],
            ['key' => 'kepala_sekolah_ttd',  'value' => null,  'group' => 'kartu_ujian'],
            ['key' => 'kartu_tanggal_cetak', 'value' => '',    'group' => 'kartu_ujian'],
        ];

        foreach ($keys as $row) {
            DB::table('settings')->insertOrIgnore($row + ['created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'kepala_sekolah_nama',
            'kepala_sekolah_nip',
            'kepala_sekolah_ttd',
            'kartu_tanggal_cetak',
        ])->delete();
    }
};
