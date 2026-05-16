<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('soal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mapel_id')->constrained('mata_pelajaran')->onDelete('cascade');
            $table->enum('tipe', ['PG', 'ESSAY', 'MATCHING'])->default('PG');
            $table->longText('konten');
            $table->string('gambar')->nullable();
            $table->text('kunci_essay')->nullable();
            $table->decimal('bobot', 5, 2)->default(1.00);
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('soal');
    }
};
