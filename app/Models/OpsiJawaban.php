<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpsiJawaban extends Model
{
    protected $table = 'opsi_jawaban';

    protected $fillable = [
        'soal_id',
        'label',
        'konten',
        'is_correct',
    ];

    public function soal(): BelongsTo
    {
        return $this->belongsTo(Soal::class, 'soal_id');
    }
}
