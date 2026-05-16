<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jawaban_peserta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ujian_peserta_id')->constrained('ujian_peserta')->onDelete('cascade');
            $table->foreignId('soal_id')->constrained('soal')->onDelete('cascade');
            $table->text('jawaban')->nullable(); // Label opsi (A) atau teks essay atau JSON matching
            $table->boolean('is_correct')->nullable();
            $table->float('score')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jawaban_peserta');
    }
};
