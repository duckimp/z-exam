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
        // 1. Tambah index unik pada ujian_peserta (mencegah double click/login ujian ganda)
        Schema::table('ujian_peserta', function (Blueprint $table) {
            $table->unique(['student_id', 'sesi_id'], 'uq_student_sesi');
        });

        // 2. Tambah index unik pada jawaban_peserta (mencegah double record jawaban soal)
        Schema::table('jawaban_peserta', function (Blueprint $table) {
            $table->unique(['ujian_peserta_id', 'soal_id'], 'uq_ujian_soal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ujian_peserta', function (Blueprint $table) {
            $table->dropUnique('uq_student_sesi');
        });

        Schema::table('jawaban_peserta', function (Blueprint $table) {
            $table->dropUnique('uq_ujian_soal');
        });
    }
};
