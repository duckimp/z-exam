<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ujian_peserta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sesi_id')->constrained('sesi_ujian')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->enum('status', ['WAITING', 'START', 'FINISH', 'BANNED'])->default('WAITING');
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->float('score')->default(0);
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ujian_peserta');
    }
};
