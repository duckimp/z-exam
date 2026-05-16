<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kartu Ujian — {{ $kelas->nama_kelas }}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #111;
      background: white;
    }

    .page {
      width: 100%;
    }

    /* Grid 2 kolom */
    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: 4mm;
    }

    /* Setiap kartu = setengah halaman = 4 per kolom × 2 kolom = 8 per A4 */
    .card {
      width: calc(50% - 2mm);
      border: 1.5px solid #222;
      border-radius: 4px;
      padding: 4mm 4mm 3mm;
      page-break-inside: avoid;
      position: relative;
    }

    /* Header kartu */
    .card-header {
      display: flex;
      align-items: center;
      gap: 3mm;
      border-bottom: 1px solid #ccc;
      padding-bottom: 3mm;
      margin-bottom: 3mm;
    }

    .logo-mark {
      width: 22px;
      height: 22px;
      background: #111;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11pt;
      font-weight: 900;
      color: white;
      flex-shrink: 0;
    }

    .header-text { flex: 1; }
    .header-title { font-size: 8.5pt; font-weight: 700; color: #111; }
    .header-sub   { font-size: 7pt;   color: #555; }

    /* Body kartu */
    .card-body {
      display: flex;
      gap: 3mm;
    }

    .card-info { flex: 1; }

    .field {
      margin-bottom: 2.5mm;
    }
    .field-label {
      font-size: 6.5pt;
      color: #777;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 0.5mm;
    }
    .field-value {
      font-size: 8.5pt;
      font-weight: 600;
      color: #111;
    }

    /* Kredensial login */
    .credentials {
      margin-top: 3mm;
      padding: 2mm 3mm;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 3px;
    }
    .credentials-label {
      font-size: 6.5pt;
      color: #555;
      margin-bottom: 1.5mm;
      font-weight: 600;
      text-transform: uppercase;
    }
    .cred-row {
      display: flex;
      gap: 2mm;
      align-items: center;
      margin-bottom: 1mm;
    }
    .cred-key   { font-size: 6.5pt; color: #777; width: 28pt; }
    .cred-val   { font-size: 8pt; font-weight: 700; color: #111; font-family: 'Courier New', monospace; }

    /* QR placeholder (DomPDF tidak support QR natively) */
    .qr-box {
      width: 22mm;
      height: 22mm;
      border: 1.5px solid #ccc;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 1mm;
      flex-shrink: 0;
    }
    .qr-inner {
      width: 18mm;
      height: 18mm;
      position: relative;
    }

    /* Simulasi pola QR code (decorative) */
    .qr-inner::before {
      content: '';
      display: block;
      width: 100%;
      height: 100%;
      background:
        repeating-linear-gradient(0deg, #111 0px, #111 2px, transparent 2px, transparent 5px),
        repeating-linear-gradient(90deg, #111 0px, #111 2px, transparent 2px, transparent 5px);
      opacity: 0.15;
    }
    .qr-nisn {
      font-size: 5pt;
      color: #999;
      text-align: center;
      font-family: monospace;
    }

    /* Card number */
    .card-number {
      position: absolute;
      top: 3mm;
      right: 3mm;
      font-size: 6pt;
      color: #bbb;
      font-family: monospace;
    }
  </style>
</head>
<body>
<div class="page">
  <div class="grid">
    @foreach($students as $index => $s)
    <div class="card">
      <span class="card-number">#{{ str_pad($index + 1, 3, '0', STR_PAD_LEFT) }}</span>

      {{-- Header --}}
      <div class="card-header">
        <div class="logo-mark">Z</div>
        <div class="header-text">
          <div class="header-title">KARTU PESERTA UJIAN</div>
          <div class="header-sub">{{ $kelas->nama_kelas }} · {{ $kelas->tahun_ajar }}</div>
        </div>
      </div>

      {{-- Body --}}
      <div class="card-body">
        {{-- Info siswa --}}
        <div class="card-info">
          <div class="field">
            <div class="field-label">Nama Peserta</div>
            <div class="field-value">{{ strtoupper($s->nama) }}</div>
          </div>
          <div class="field">
            <div class="field-label">NISN</div>
            <div class="field-value" style="font-family: 'Courier New', monospace;">{{ $s->nisn }}</div>
          </div>
          @if($s->ttl)
          <div class="field">
            <div class="field-label">Tempat, Tgl Lahir</div>
            <div class="field-value">{{ $s->tempat_lahir ?? '—' }}, {{ $s->ttl->format('d/m/Y') }}</div>
          </div>
          @endif

          {{-- Kredensial --}}
          <div class="credentials">
            <div class="credentials-label">Kredensial Login</div>
            <div class="cred-row">
              <span class="cred-key">Username</span>
              <span class="cred-val">{{ $s->username }}</span>
            </div>
            <div class="cred-row">
              <span class="cred-key">Password</span>
              <span class="cred-val">{{ $s->nisn }}</span>
            </div>
          </div>
        </div>

        {{-- QR area --}}
        <div class="qr-box">
          <div class="qr-inner"></div>
          <div class="qr-nisn">{{ $s->nisn }}</div>
        </div>
      </div>
    </div>
    @endforeach
  </div>
</div>
</body>
</html>
