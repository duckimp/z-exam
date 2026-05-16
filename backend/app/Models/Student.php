<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    protected $fillable = [
        'kelas_id',
        'nisn',
        'nama',
        'ttl',
        'tempat_lahir',
        'jk',
        'username',
        'password',
        'is_active',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'ttl'       => 'date',
        'is_active' => 'boolean',
    ];

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    /**
     * Auto-set username & password = NISN sebelum create
     */
    protected static function booted(): void
    {
        static::creating(function (Student $student) {
            if (empty($student->username)) {
                $student->username = $student->nisn;
            }
            if (empty($student->password)) {
                $student->password = bcrypt($student->nisn);
            }
        });
    }
}
