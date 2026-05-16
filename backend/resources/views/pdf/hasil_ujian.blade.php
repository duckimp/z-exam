<!DOCTYPE html>
<html>
<head>
    <title>Hasil Ujian {{ $peserta->student->nama }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .info-table { width: 100%; margin-bottom: 20px; }
        .info-table td { padding: 3px; }
        .score-box { border: 2px solid #000; padding: 10px; width: 150px; text-align: center; float: right; }
        .score-value { font-size: 24px; font-weight: bold; }
        .soal-item { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .jawaban-benar { color: green; font-weight: bold; }
        .jawaban-salah { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h2>REKAPITULASI HASIL UJIAN BERBASIS KOMPUTER</h2>
        <h1>Z-EXAM CBT SYSTEM</h1>
    </div>

    <div class="score-box">
        TOTAL SKOR<br/>
        <div class="score-value">{{ $peserta->score }}</div>
    </div>

    <table class="info-table">
        <tr>
            <td width="100">Nama Siswa</td>
            <td>: {{ $peserta->student->nama }}</td>
        </tr>
        <tr>
            <td>NISN</td>
            <td>: {{ $peserta->student->nisn }}</td>
        </tr>
        <tr>
            <td>Mata Pelajaran</td>
            <td>: {{ $peserta->sesi->mapel->nama_mapel }}</td>
        </tr>
        <tr>
            <td>Sesi</td>
            <td>: {{ $peserta->sesi->nama_sesi }}</td>
        </tr>
        <tr>
            <td>Waktu</td>
            <td>: {{ $peserta->start_time }} - {{ $peserta->end_time }}</td>
        </tr>
    </table>

    <div style="clear: both;"></div>
    <hr/>

    <h3>DETAIL JAWABAN:</h3>

    @foreach($peserta->jawaban as $idx => $j)
        <div class="soal-item">
            <strong>{{ $idx + 1 }}. {!! strip_tags($j->soal->konten) !!}</strong><br/>
            Jawaban Anda: 
            <span class="{{ $j->is_correct ? 'jawaban-benar' : 'jawaban-salah' }}">
                {{ $j->jawaban ?? '—' }} 
                @if($j->is_correct) (BENAR) @else (SALAH) @endif
            </span>
            <br/>
            Skor: {{ $j->score }}
        </div>
    @endforeach

    <div style="margin-top: 50px; text-align: right;">
        Dicetak pada: {{ date('d/m/Y H:i:s') }}
    </div>
</body>
</html>
