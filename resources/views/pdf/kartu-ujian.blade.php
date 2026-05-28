<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kartu Ujian — {{ $kelas->nama_kelas }}</title>
    <style>
        @page { margin: 0.5cm; }
        body { font-family: sans-serif; margin: 0; padding: 0; background: #fff; }
        
        /* Table Grid */
        .main-table { width: 100%; border-collapse: separate; border-spacing: 10px; table-layout: fixed; }
        .card-td { width: 50%; padding: 0; vertical-align: top; }

        /* Card Box */
        .card {
            border: 2px solid #1e3a8a;
            border-radius: 10px;
            height: 6cm;
            position: relative;
            overflow: hidden;
            background: #fff;
        }

        /* Header */
        .header {
            background-color: #1e3a8a;
            color: #ffffff;
            padding: 10px;
            border-bottom: 2px solid #fbbf24;
        }
        .header-table { width: 100%; border-collapse: collapse; }
        .logo { 
            width: 30px; height: 30px; background: white; color: #1e3a8a; 
            text-align: center; line-height: 30px; font-weight: bold; font-size: 18px;
            border-radius: 4px;
        }
        .title { padding-left: 10px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .sub-title { padding-left: 10px; font-size: 8px; opacity: 0.9; }

        /* Content */
        .content-table { width: 100%; margin-top: 10px; padding: 0 10px; }
        .qr-cell { width: 90px; vertical-align: top; text-align: center; }
        .qr-img {
            width: 85px; height: 85px;
            border: 1px solid #3b82f6;
            border-radius: 4px;
        }
        .qr-label {
            font-size: 6px; color: #6b7280;
            text-align: center; margin-top: 2px;
            line-height: 1.3;
        }
        .info-cell { vertical-align: top; padding-left: 10px; padding-right: 105px; }
        
        .label { font-size: 7px; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
        .value { font-size: 10px; font-weight: bold; color: #000; margin-bottom: 8px; }

        /* Credentials */
        .creds {
            background: #eff6ff;
            border: 1px dashed #3b82f6;
            padding: 5px 8px;
            border-radius: 4px;
            margin-top: 5px;
            display: inline-block;
            min-width: 100px;
        }
        .creds-title { font-size: 7px; font-weight: bold; color: #1e40af; margin-bottom: 3px; }
        .creds-item { font-size: 9px; font-family: monospace; }
        .creds-item span { color: #6b7280; }

        /* Footer */
        .footer {
            position: absolute;
            bottom: 8px;
            right: 10px;
            text-align: right;
        }
        .ttd-box { text-align: center; }
        .ttd-img { height: 36px; max-width: 90px; object-fit: contain; display: block; margin: 0 auto 2px; }
        .ttd-tanggal { font-size: 6px; color: #374151; margin-bottom: 2px; }
        .ttd-nama { font-size: 7px; font-weight: bold; color: #111; border-top: 1px solid #374151; padding-top: 2px; margin-top: 2px; white-space: nowrap; }
        .ttd-nip  { font-size: 6px; color: #6b7280; font-family: monospace; }
        .version { font-size: 6px; color: #9ca3af; margin-top: 3px; }

        .page-break { page-break-after: always; }
    </style>
</head>
<body>

<table class="main-table">
    @foreach($students->chunk(2) as $row)
        <tr>
            @foreach($row as $s)
                <td class="card-td">
                    <div class="card">
                        <div class="header">
                            <table class="header-table">
                                <tr>
                                    <td style="width: 30px;"><div class="logo">Z</div></td>
                                    <td>
                                        <div class="title">KARTU PESERTA UJIAN</div>
                                        <div class="sub-title">{{ $kelas->nama_kelas }} · TA {{ $kelas->tahun_ajar }}</div>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <table class="content-table">
                            <tr>
                                <td class="qr-cell">
                                    @if($s->qr_base64)
                                        <img src="{{ $s->qr_base64 }}" class="qr-img" alt="QR Login">
                                    @else
                                        <div style="width:70px;height:70px;border:1px dashed #9ca3af;border-radius:4px;background:#f9fafb;">
                                            <span style="font-size:7px;color:#9ca3af;display:block;text-align:center;padding-top:28px;">QR N/A</span>
                                        </div>
                                    @endif
                                    <div class="qr-label">Scan untuk<br>login otomatis</div>
                                </td>
                                <td class="info-cell">
                                    <div class="label">Nama Lengkap</div>
                                    <div class="value">{{ strtoupper($s->nama) }}</div>
                                    
                                    <div class="label">NISN / No. Peserta</div>
                                    <div class="value">{{ $s->nisn }}</div>

                                    <div class="creds">
                                        <div class="creds-title">AKSES LOGIN</div>
                                        <div class="creds-item"><span>User:</span> <strong>{{ $s->username }}</strong></div>
                                        <div class="creds-item"><span>Pass:</span> <strong>{{ $s->nisn }}</strong></div>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <div class="footer">
                            <div class="ttd-box">
                                @if(!empty($settings['kartu_tanggal_cetak']))
                                    <div class="ttd-tanggal">{{ $settings['kartu_tanggal_cetak'] }}</div>
                                @endif
                                @if($ttdBase64)
                                    <img src="{{ $ttdBase64 }}" class="ttd-img" alt="TTD">
                                @else
                                    <div style="height:36px;"></div>
                                @endif
                                @if(!empty($settings['kepala_sekolah_nama']))
                                    <div class="ttd-nama">{{ $settings['kepala_sekolah_nama'] }}</div>
                                @endif
                                @if(!empty($settings['kepala_sekolah_nip']))
                                    <div class="ttd-nip">NIP. {{ $settings['kepala_sekolah_nip'] }}</div>
                                @endif
                            </div>
                            <div class="version">Z-Exam v1.0.0</div>
                        </div>
                    </div>
                </td>
            @endforeach
            @if(count($row) < 2)
                <td class="card-td"></td>
            @endif
        </tr>
        
        {{-- Setiap 4 baris (8 kartu), kasih page break --}}
        @if(($loop->iteration % 4 == 0) && !$loop->last)
            </table>
            <div class="page-break"></div>
            <table class="main-table">
        @endif
    @endforeach
</table>

</body>
</html>
