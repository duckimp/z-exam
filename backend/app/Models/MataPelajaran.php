<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MataPelajaran extends Model
{
    protected $table = 'mata_pelajaran';

    protected $fillable = [
        'nama_mapel',
        'kode_mapel',
        'tingkat',
    ];

    public function soal(): HasMany
    {
        return $this->hasMany(Soal::class, 'mapel_id');
    }
}
