<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matching_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('soal_id')->constrained('soal')->onDelete('cascade');
            $table->text('item_kiri');
            $table->text('item_kanan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matching_items');
    }
};
