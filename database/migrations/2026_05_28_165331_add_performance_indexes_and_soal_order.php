<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fix #7 — index pada tingkat untuk whereHas di dashboard()
        Schema::table('mata_pelajaran', function (Blueprint $table) {
            $table->index('tingkat', 'idx_mapel_tingkat');
        });

        // Fix #4 — simpan urutan soal yang sudah diacak per ujian
        Schema::table('ujian_peserta', function (Blueprint $table) {
            $table->json('soal_order')->nullable()->after('user_agent');
        });
    }

    public function down(): void
    {
        Schema::table('mata_pelajaran', function (Blueprint $table) {
            $table->dropIndex('idx_mapel_tingkat');
        });

        Schema::table('ujian_peserta', function (Blueprint $table) {
            $table->dropColumn('soal_order');
        });
    }
};
