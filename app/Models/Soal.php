<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Soal extends Model
{
    protected $table = 'soal';

    protected $fillable = [
        'mapel_id',
        'tipe',
        'konten',
        'gambar',
        'kunci_essay',
        'bobot',
        'urutan',
    ];

    public function mapel(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'mapel_id');
    }

    public function opsi(): HasMany
    {
        return $this->hasMany(OpsiJawaban::class, 'soal_id');
    }

    public function matchingItems(): HasMany
    {
        return $this->hasMany(MatchingItem::class, 'soal_id');
    }
}
