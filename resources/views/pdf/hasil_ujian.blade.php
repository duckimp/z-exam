<!DOCTYPE html>
<html>
<head>
    <title>Hasil Ujian {{ $peserta->student->nama }}</title>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #222; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 18px; }
        .header h2 { margin: 4px 0 0; font-size: 13px; font-weight: normal; color: #555; }
        .info-table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
        .info-table td { padding: 3px 6px; vertical-align: top; }
        .info-table td:first-child { width: 120px; font-weight: bold; color: #444; }
        .score-box {
            border: 2px solid #333; padding: 10px 16px;
            width: 160px; text-align: center;
            float: right; margin-left: 16px; margin-bottom: 10px;
            border-radius: 6px;
        }
        .score-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .score-value { font-size: 32px; font-weight: bold; color: #111; line-height: 1.1; }
        .score-max { font-size: 11px; color: #888; margin-top: 2px; }
        .soal-item { margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #e8e8e8; }
        .soal-nomor { font-weight: bold; color: #333; }
        .soal-konten { margin: 3px 0 5px 0; line-height: 1.5; }
        .jawaban-benar { color: #16a34a; font-weight: bold; }
        .jawaban-salah { color: #dc2626; font-weight: bold; }
        .jawaban-kosong { color: #9ca3af; font-style: italic; }
        .badge-benar { background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .badge-salah { background: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .badge-kosong { background: #f3f4f6; color: #6b7280; padding: 1px 6px; border-radius: 4px; font-size: 10px; }
        .skor-line { margin-top: 3px; font-size: 11px; color: #555; }
        h3 { border-bottom: 1px solid #ccc; padding-bottom: 4px; font-size: 13px; color: #333; margin-bottom: 12px; }
        .footer { margin-top: 40px; text-align: right; font-size: 10px; color: #aaa; }
        .summary-bar { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 14px; margin-bottom: 16px; display: flex; }
        .summary-item { margin-right: 28px; }
        .summary-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-val { font-size: 15px; font-weight: bold; color: #222; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Z-EXAM CBT SYSTEM</h1>
        <h2>REKAPITULASI HASIL UJIAN BERBASIS KOMPUTER</h2>
    </div>

    <div class="score-box">
        <div class="score-label">Total Skor</div>
        <div class="score-value">{{ $peserta->score }}</div>
        <div class="score-max">dari maks. {{ $skorMaksimal }}</div>
    </div>

    <table class="info-table">
        <tr><td>Nama Siswa</td><td>: {{ $peserta->student->nama }}</td></tr>
        <tr><td>NISN</td><td>: {{ $peserta->student->nisn }}</td></tr>
        <tr><td>Mata Pelajaran</td><td>: {{ $peserta->sesi->mapel->nama_mapel }}</td></tr>
        <tr><td>Sesi Ujian</td><td>: {{ $peserta->sesi->nama_sesi }}</td></tr>
        <tr><td>Waktu</td><td>: {{ $peserta->start_time }} s/d {{ $peserta->end_time }}</td></tr>
    </table>

    <div style="clear: both;"></div>

    {{-- Ringkasan --}}
    <table style="width:100%; border-collapse:collapse; margin-bottom:16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px;">
        <tr>
            <td style="padding:8px 14px; border-right:1px solid #e5e7eb;">
                <div style="font-size:10px; color:#888; text-transform:uppercase;">Total Soal</div>
                <div style="font-size:15px; font-weight:bold;">{{ $totalSoal }}</div>
            </td>
            <td style="padding:8px 14px; border-right:1px solid #e5e7eb;">
                <div style="font-size:10px; color:#888; text-transform:uppercase;">Dijawab</div>
                <div style="font-size:15px; font-weight:bold; color:#1d4ed8;">{{ $soalList->where('dijawab', true)->count() }}</div>
            </td>
            <td style="padding:8px 14px; border-right:1px solid #e5e7eb;">
                <div style="font-size:10px; color:#888; text-transform:uppercase;">Benar</div>
                <div style="font-size:15px; font-weight:bold; color:#16a34a;">{{ $soalList->where('is_correct', true)->count() }}</div>
            </td>
            <td style="padding:8px 14px; border-right:1px solid #e5e7eb;">
                <div style="font-size:10px; color:#888; text-transform:uppercase;">Salah</div>
                <div style="font-size:15px; font-weight:bold; color:#dc2626;">{{ $soalList->where('dijawab', true)->where('is_correct', false)->count() }}</div>
            </td>
            <td style="padding:8px 14px;">
                <div style="font-size:10px; color:#888; text-transform:uppercase;">Tdk Dijawab</div>
                <div style="font-size:15px; font-weight:bold; color:#9ca3af;">{{ $soalList->where('dijawab', false)->count() }}</div>
            </td>
        </tr>
    </table>

    <h3>DETAIL JAWABAN ({{ $totalSoal }} Soal)</h3>

    @foreach($soalList as $item)
        <div class="soal-item">
            <span class="soal-nomor">{{ $item['nomor'] }}.</span>
            <span class="soal-konten">{{ $item['konten'] }}</span><br/>

            @if($item['dijawab'])
                Jawaban Anda:
                <span class="{{ $item['is_correct'] ? 'jawaban-benar' : 'jawaban-salah' }}">
                    {{ $item['jawaban'] ?? '—' }}
                </span>
                @if($item['is_correct'] === true)
                    <span class="badge-benar">BENAR</span>
                @elseif($item['is_correct'] === false)
                    <span class="badge-salah">SALAH</span>
                @else
                    <span class="badge-kosong">BELUM DINILAI</span>
                @endif
            @else
                <span class="jawaban-kosong">— Tidak Dijawab —</span>
                <span class="badge-kosong">KOSONG</span>
            @endif
            <div class="skor-line">Skor: <strong>{{ $item['score'] }}</strong></div>
        </div>
    @endforeach

    <div class="footer">
        Dicetak pada: {{ date('d/m/Y H:i:s') }}
    </div>
</body>
</html>
