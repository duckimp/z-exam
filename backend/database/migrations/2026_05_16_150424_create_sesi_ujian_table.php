<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sesi_ujian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mapel_id')->constrained('mata_pelajaran')->onDelete('cascade');
            $table->string('nama_sesi');
            $table->date('tanggal');
            $table->time('jam_mulai');
            $table->integer('durasi'); // Menit
            $table->string('token', 6)->unique();
            $table->boolean('random_soal')->default(true);
            $table->boolean('random_opsi')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sesi_ujian');
    }
};
