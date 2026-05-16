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
        'is_active',
    ];

    public function mapel(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'mapel_id');
    }

    public function peserta(): HasMany
    {
        return $this->hasMany(UjianPeserta::class, 'sesi_id');
    }
}
