<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kelas', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kelas');          // Contoh: "VII A"
            $table->string('tingkat');             // Contoh: "VII", "VIII", "IX"
            $table->string('tahun_ajar');          // Contoh: "2025/2026"
            $table->string('wali_kelas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kelas');
    }
};
