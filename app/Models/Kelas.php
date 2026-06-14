<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kelas extends Model
{
    protected $table = 'kelas';

    protected $fillable = [
        'nama_kelas',
        'tingkat',
        'tahun_ajar',
        'wali_kelas',
    ];

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }
}
