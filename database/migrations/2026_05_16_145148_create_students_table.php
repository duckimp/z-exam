<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete();
            $table->string('nisn', 20)->unique();
            $table->string('nama');
            $table->date('ttl')->nullable();           // Tanggal lahir
            $table->string('tempat_lahir')->nullable();
            $table->enum('jk', ['L', 'P'])->nullable(); // L = Laki, P = Perempuan
            $table->string('username', 20)->unique();  // Default = NISN
            $table->string('password');                // Hashed, default = NISN
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
