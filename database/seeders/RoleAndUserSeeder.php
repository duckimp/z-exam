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
        $admin = User::updateOrCreate(
            ['email' => 'admin@z-exam.local'],
            [
                'username' => 'admin',
                'name'     => 'Administrator',
                'password' => bcrypt('password123'),
            ]
        );
        $admin->assignRole($superAdmin);

        // ── Akun Demo Guru ───────────────────────────────────────────────────
        $guruUser = User::updateOrCreate(
            ['email' => 'guru@z-exam.local'],
            [
                'username' => 'guru',
                'name'     => 'Guru',
                'password' => bcrypt('guru123'),
            ]
        );
        $guruUser->assignRole($guru);

        // ── Akun Demo Pengawas ───────────────────────────────────────────────
        $pengawasUser = User::updateOrCreate(
            ['email' => 'pengawas@z-exam.local'],
            [
                'username' => 'pengawas',
                'name'     => 'Pengawas',
                'password' => bcrypt('pengawas123'),
            ]
        );
        $pengawasUser->assignRole($pengawas);

        $this->command->info('✅ Roles dan akun default berhasil dibuat!');
        $this->command->table(
            ['Role', 'Username', 'Password'],
            [
                ['super_admin', 'admin', 'password123'],
                ['guru',        'guru',  'guru123'],
                ['pengawas',    'pengawas',  'pengawas123'],
            ]
        );
    }
}
