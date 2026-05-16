<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatchingItem extends Model
{
    protected $table = 'matching_items';

    protected $fillable = [
        'soal_id',
        'item_kiri',
        'item_kanan',
    ];

    public function soal(): BelongsTo
    {
        return $this->belongsTo(Soal::class, 'soal_id');
    }
}
