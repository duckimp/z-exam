<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UjianPeserta extends Model
{
    protected $table = 'ujian_peserta';

    protected $fillable = [
        'sesi_id',
        'student_id',
        'status',
        'start_time',
        'end_time',
        'score',
        'ip_address',
        'user_agent',
        'soal_order',
    ];

    protected $casts = [
        'soal_order' => 'array',
    ];

    public function sesi(): BelongsTo
    {
        return $this->belongsTo(SesiUjian::class, 'sesi_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function jawaban(): HasMany
    {
        return $this->hasMany(JawabanPeserta::class, 'ujian_peserta_id');
    }
}
