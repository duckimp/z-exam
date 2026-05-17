<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SesiUjian extends Model
{
    protected $table = 'sesi_ujian';

    protected $fillable = [
        'mapel_id',
        'nama_sesi',
        'tanggal',
        'jam_mulai',
        'durasi',
        'token',
        'random_soal',
        'random_opsi',
        'anti_curang',
        'use_token',
        'is_active',
    ];

    protected $casts = [
        'tanggal'     => 'date',
        'random_soal' => 'boolean',
        'random_opsi' => 'boolean',
        'anti_curang' => 'boolean',
        'use_token'   => 'boolean',
        'is_active'   => 'boolean',
    ];

    public function mapel(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'mapel_id');
    }

    public function pesertaUjian(): HasMany
    {
        return $this->hasMany(UjianPeserta::class, 'sesi_id');
    }
}
