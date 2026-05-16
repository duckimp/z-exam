<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndUserSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles & permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Buat Roles ──────────────────────────────────────────────────────
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $guru       = Role::firstOrCreate(['name' => 'guru',        'guard_name' => 'web']);
        $pengawas   = Role::firstOrCreate(['name' => 'pengawas',    'guard_name' => 'web']);

        // ── Akun Default Super Admin ─────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@z-exam.local'],
            [
                'name'     => 'Administrator',
                'password' => bcrypt('admin123'),
            ]
        );
        $admin->assignRole($superAdmin);

        // ── Akun Demo Guru ───────────────────────────────────────────────────
        $guruUser = User::firstOrCreate(
            ['email' => 'guru@z-exam.local'],
            [
                'name'     => 'Budi Santoso',
                'password' => bcrypt('guru123'),
            ]
        );
        $guruUser->assignRole($guru);

        // ── Akun Demo Pengawas ───────────────────────────────────────────────
        $pengawasUser = User::firstOrCreate(
            ['email' => 'pengawas@z-exam.local'],
            [
                'name'     => 'Siti Aminah',
                'password' => bcrypt('pengawas123'),
            ]
        );
        $pengawasUser->assignRole($pengawas);

        $this->command->info('✅ Roles dan akun default berhasil dibuat!');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['super_admin', 'admin@z-exam.local',    'admin123'],
                ['guru',        'guru@z-exam.local',     'guru123'],
                ['pengawas',    'pengawas@z-exam.local', 'pengawas123'],
            ]
        );
    }
}
