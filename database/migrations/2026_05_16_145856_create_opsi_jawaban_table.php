<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opsi_jawaban', function (Blueprint $table) {
            $table->id();
            $table->foreignId('soal_id')->constrained('soal')->onDelete('cascade');
            $table->string('label', 10); // A, B, C, D, E
            $table->text('konten');
            $table->boolean('is_correct')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opsi_jawaban');
    }
};
