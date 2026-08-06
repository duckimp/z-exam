<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update tabel soal untuk analitik cerdas
        Schema::table('soal', function (Blueprint $table) {
            // Kolom untuk menyimpan kata kunci esai (JSON array)
            // Format: [{"keyword": "fotosintesis", "bobot": 3}, {"keyword": "klorofil", "bobot": 1}]
            $table->json('keyword_esai')->nullable()->after('kunci_essay');
            
            // Kolom untuk topik/materi (untuk pemetaan remedial)
            $table->string('topik_materi')->nullable()->after('keyword_esai');
        });

        // Update tabel jawaban_peserta untuk koreksi otomatis esai
        Schema::table('jawaban_peserta', function (Blueprint $table) {
            // Skor draft dari sistem sebelum divalidasi guru
            $table->decimal('skor_esai_draft', 5, 2)->nullable()->after('score');
            
            // Timestamp untuk tracking kecepatan pengerjaan
            $table->timestamp('answered_at')->nullable()->after('skor_esai_draft');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            $table->dropColumn(['keyword_esai', 'topik_materi']);
        });

        Schema::table('jawaban_peserta', function (Blueprint $table) {
            $table->dropColumn(['skor_esai_draft', 'answered_at']);
        });
    }
};
