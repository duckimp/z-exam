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
        Schema::table('sesi_ujian', function (Blueprint $table) {
            if (!Schema::hasColumn('sesi_ujian', 'anti_curang')) {
                $table->boolean('anti_curang')->default(false)->after('random_opsi');
            }
            if (!Schema::hasColumn('sesi_ujian', 'use_token')) {
                $table->boolean('use_token')->default(true)->after('anti_curang');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sesi_ujian', function (Blueprint $table) {
            $table->dropColumn(['anti_curang', 'use_token']);
        });
    }
};
