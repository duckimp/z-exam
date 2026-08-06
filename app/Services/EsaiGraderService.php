<?php

namespace App\Services;

/**
 * EsaiGraderService
 * 
 * Service untuk menghitung nilai draft otomatis soal esai
 * menggunakan kombinasi Keyword Weighting dan Cosine Similarity
 */
class EsaiGraderService
{
    /**
     * Hitung draft nilai esai
     * 
     * @param string $jawabanSiswa Teks jawaban siswa
     * @param string $jawabanIdeal Teks contoh jawaban ideal dari guru
     * @param array|null $keywords Array keyword dengan bobot, format: [["keyword" => "fotosintesis", "bobot" => 3], ...]
     * @return array ['score' => float, 'keyword_score' => float, 'similarity_score' => float, 'matched_keywords' => array]
     */
    public function hitungDraftNilai(string $jawabanSiswa, string $jawabanIdeal, ?array $keywords = null): array
    {
        // Normalisasi teks
        $jawabanSiswa = $this->normalisasiTeks($jawabanSiswa);
        $jawabanIdeal = $this->normalisasiTeks($jawabanIdeal);

        // Hitung keyword score (jika ada keyword)
        $keywordResult = $this->calcKeywordScore($jawabanSiswa, $keywords);
        $keywordScore = $keywordResult['score'];
        $matchedKeywords = $keywordResult['matched'];

        // Hitung cosine similarity
        $similarityScore = $this->calcCosineSimilarity($jawabanSiswa, $jawabanIdeal);

        // Kombinasi skor (bobot 70% keyword, 30% similarity)
        // Jika tidak ada keyword, 100% dari similarity
        if (!empty($keywords)) {
            $finalScore = ($keywordScore * 0.7) + ($similarityScore * 0.3);
        } else {
            $finalScore = $similarityScore;
        }

        return [
            'score' => round($finalScore, 2),
            'keyword_score' => round($keywordScore, 2),
            'similarity_score' => round($similarityScore, 2),
            'matched_keywords' => $matchedKeywords,
        ];
    }

    /**
     * Hitung skor berdasarkan keyword yang ditemukan
     * 
     * @param string $jawabanSiswa
     * @param array|null $keywords
     * @return array ['score' => float, 'matched' => array]
     */
    private function calcKeywordScore(string $jawabanSiswa, ?array $keywords): array
    {
        if (empty($keywords)) {
            return ['score' => 100, 'matched' => []];
        }

        $totalBobot = 0;
        $bobotTerpenuhi = 0;
        $matched = [];

        foreach ($keywords as $kw) {
            $keyword = strtolower(trim($kw['keyword'] ?? ''));
            $bobot = floatval($kw['bobot'] ?? 1);

            if (empty($keyword)) continue;

            $totalBobot += $bobot;

            // Cek apakah keyword ada di jawaban siswa (toleransi typo dengan levenshtein)
            if ($this->isKeywordFound($jawabanSiswa, $keyword)) {
                $bobotTerpenuhi += $bobot;
                $matched[] = $keyword;
            }
        }

        // Kalkulasi persentase
        $score = $totalBobot > 0 ? ($bobotTerpenuhi / $totalBobot) * 100 : 100;

        return [
            'score' => $score,
            'matched' => $matched,
        ];
    }

    /**
     * Cek apakah keyword ditemukan dalam teks (dengan toleransi typo)
     */
    private function isKeywordFound(string $text, string $keyword): bool
    {
        // Exact match (case insensitive)
        if (str_contains($text, $keyword)) {
            return true;
        }

        // Toleransi typo: cek setiap kata di teks dengan levenshtein distance
        $words = explode(' ', $text);
        $keywordLength = strlen($keyword);

        foreach ($words as $word) {
            // Toleransi maksimal 2 karakter berbeda untuk kata panjang (>5 huruf)
            $maxDistance = $keywordLength > 5 ? 2 : 1;
            
            if (levenshtein($word, $keyword) <= $maxDistance) {
                return true;
            }
        }

        return false;
    }

    /**
     * Hitung Cosine Similarity antara dua teks
     * 
     * @param string $text1
     * @param string $text2
     * @return float Nilai 0-100
     */
    private function calcCosineSimilarity(string $text1, string $text2): float
    {
        // Tokenisasi (pecah jadi array kata)
        $words1 = $this->tokenize($text1);
        $words2 = $this->tokenize($text2);

        if (empty($words1) || empty($words2)) {
            return 0;
        }

        // Buat term frequency vectors
        $vector1 = $this->termFrequency($words1);
        $vector2 = $this->termFrequency($words2);

        // Gabungkan semua term unik
        $allTerms = array_unique(array_merge(array_keys($vector1), array_keys($vector2)));

        // Hitung dot product dan magnitudes
        $dotProduct = 0;
        $magnitude1 = 0;
        $magnitude2 = 0;

        foreach ($allTerms as $term) {
            $val1 = $vector1[$term] ?? 0;
            $val2 = $vector2[$term] ?? 0;

            $dotProduct += ($val1 * $val2);
            $magnitude1 += ($val1 * $val1);
            $magnitude2 += ($val2 * $val2);
        }

        $magnitude1 = sqrt($magnitude1);
        $magnitude2 = sqrt($magnitude2);

        if ($magnitude1 == 0 || $magnitude2 == 0) {
            return 0;
        }

        // Cosine similarity
        $similarity = $dotProduct / ($magnitude1 * $magnitude2);

        // Konversi ke skala 0-100
        return $similarity * 100;
    }

    /**
     * Normalisasi teks (lowercase, hapus tanda baca, trim)
     */
    private function normalisasiTeks(string $text): string
    {
        $text = strtolower($text);
        $text = preg_replace('/[^\w\s]/u', ' ', $text); // Hapus tanda baca
        $text = preg_replace('/\s+/', ' ', $text); // Hapus multiple spaces
        return trim($text);
    }

    /**
     * Tokenisasi teks menjadi array kata
     */
    private function tokenize(string $text): array
    {
        $words = explode(' ', $text);
        
        // Filter stopwords sederhana (opsional)
        $stopwords = ['dan', 'atau', 'yang', 'untuk', 'pada', 'di', 'ke', 'dari', 'ini', 'itu', 'adalah', 'dengan'];
        
        return array_filter($words, function($word) use ($stopwords) {
            return strlen($word) > 2 && !in_array($word, $stopwords);
        });
    }

    /**
     * Hitung term frequency
     */
    private function termFrequency(array $words): array
    {
        $freq = [];
        foreach ($words as $word) {
            $freq[$word] = ($freq[$word] ?? 0) + 1;
        }
        return $freq;
    }

    /**
     * Hitung skor untuk isian singkat (dengan levenshtein distance)
     * 
     * @param string $jawabanSiswa
     * @param string $kunciJawaban
     * @return float Skor 0-100
     */
    public function hitungIsianSingkat(string $jawabanSiswa, string $kunciJawaban): float
    {
        $jawabanSiswa = $this->normalisasiTeks($jawabanSiswa);
        $kunciJawaban = $this->normalisasiTeks($kunciJawaban);

        // Exact match
        if ($jawabanSiswa === $kunciJawaban) {
            return 100;
        }

        // Hitung levenshtein distance
        $distance = levenshtein($jawabanSiswa, $kunciJawaban);
        $maxLength = max(strlen($jawabanSiswa), strlen($kunciJawaban));

        if ($maxLength == 0) {
            return 0;
        }

        // Toleransi maksimal 2 karakter berbeda
        if ($distance <= 2) {
            $similarity = (1 - ($distance / $maxLength)) * 100;
            return $similarity;
        }

        return 0;
    }
}
