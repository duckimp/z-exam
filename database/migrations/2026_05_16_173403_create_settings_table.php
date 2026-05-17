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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group')->default('general');
            $table->timestamps();
        });

        // Seed default settings
        DB::table('settings')->insert([
            ['key' => 'app_name', 'value' => 'Z-EXAM CBT', 'group' => 'general'],
            ['key' => 'school_name', 'value' => 'SMK Negeri Contoh', 'group' => 'general'],
            ['key' => 'school_logo', 'value' => null, 'group' => 'general'],
            ['key' => 'theme_color', 'value' => '#6366f1', 'group' => 'appearance'],
            ['key' => 'footer_text', 'value' => 'Copyright © 2026 Z-Exam - Developed by Andi FR. All rights reserved.', 'group' => 'general'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
