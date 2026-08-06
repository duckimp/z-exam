<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Index database untuk kolom yang sering dipakai di query analitik
     * (WHERE/GROUP BY/ORDER BY) agar tetap cepat saat data membengkak:
     *   - soal.topik_materi      → WHERE di petaRemedial()
     *   - jawaban_peserta.is_correct    → WHERE di analisisSoal(), deteksiAnomali()
     *   - jawaban_peserta.answered_at   → tracking kecepatan pengerjaan
     *   - jawaban_peserta.score         → agregasi nilai per soal
     *   - ujian_peserta.score           → agregasi nilai per peserta
     * (soal_id & ujian_peserta_id sudah otomatis ter-index via foreignId())
     */
    public function up(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            $table->index('topik_materi', 'idx_soal_topik_materi');
        });

        Schema::table('jawaban_peserta', function (Blueprint $table) {
            $table->index('is_correct', 'idx_jawaban_is_correct');
            $table->index('answered_at', 'idx_jawaban_answered_at');
            $table->index('score', 'idx_jawaban_score');
        });

        Schema::table('ujian_peserta', function (Blueprint $table) {
            $table->index('score', 'idx_ujian_peserta_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            $table->dropIndex('idx_soal_topik_materi');
        });

        Schema::table('jawaban_peserta', function (Blueprint $table) {
            $table->dropIndex('idx_jawaban_is_correct');
            $table->dropIndex('idx_jawaban_answered_at');
            $table->dropIndex('idx_jawaban_score');
        });

        Schema::table('ujian_peserta', function (Blueprint $table) {
            $table->dropIndex('idx_ujian_peserta_score');
        });
    }
};
