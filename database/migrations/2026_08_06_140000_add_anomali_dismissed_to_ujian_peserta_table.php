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
        // Kolom untuk menyimpan daftar jenis anomali yang ditandai WAJAR oleh pengawas.
        // Format JSON: ["speed_run", "perfect_on_hard", ...]
        Schema::table('ujian_peserta', function (Blueprint $table) {
            $table->json('anomali_dismissed')->nullable()->after('soal_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ujian_peserta', function (Blueprint $table) {
            $table->dropColumn('anomali_dismissed');
        });
    }
};
