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
        .photo-cell { width: 70px; vertical-align: top; }
        .photo { 
            width: 60px; height: 80px; border: 1px solid #ddd; 
            background: #f3f4f6; color: #9ca3af; font-size: 8px; 
            text-align: center; line-height: 80px; 
        }
        .info-cell { vertical-align: top; padding-left: 10px; }
        
        .label { font-size: 7px; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
        .value { font-size: 10px; font-weight: bold; color: #000; margin-bottom: 8px; }

        /* Credentials */
        .creds {
            background: #eff6ff;
            border: 1px dashed #3b82f6;
            padding: 5px 8px;
            border-radius: 4px;
            margin-top: 5px;
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
        .qr { width: 40px; height: 40px; border: 1px solid #000; margin-left: auto; margin-bottom: 2px; }
        .qr-dots {
            width: 100%; height: 100%;
            background-image: radial-gradient(#000 20%, transparent 20%);
            background-size: 5px 5px; opacity: 0.6;
        }
        .version { font-size: 6px; color: #9ca3af; }

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
                                <td class="photo-cell">
                                    <div class="photo">2x3 PHOTO</div>
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
                            <div class="qr">
                                @if($s->qr_base64)
                                    <img src="{{ $s->qr_base64 }}" style="width: 100%; height: 100%;">
                                @else
                                    <div class="qr-dots"></div>
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
