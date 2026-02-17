<?php
/**
 * Membuat ZIP berisi file PHP yang berubah (berdasarkan git status)
 * Siap untuk diupload ke server Linux (path fix untuk Windows)
 */

$zip = new ZipArchive();
$zipFile = __DIR__ . '/zip-php.zip';

if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
    exit("❌ Tidak bisa membuat ZIP file\n");
}

$rootPath = realpath(__DIR__);
exec('git status --porcelain', $output);

if (empty($output)) {
    exit("Tidak ada perubahan terdeteksi oleh git.\n");
}

$added = 0;
foreach ($output as $line) {
    $file = trim(substr($line, 3));

    if (!file_exists($file)) {
        continue;
    }

    $ext = pathinfo($file, PATHINFO_EXTENSION);
    if (!in_array($ext, ['php', 'json'])) {
        continue;
    }

    $absolutePath = realpath($file);
    $relativePath = str_replace($rootPath . DIRECTORY_SEPARATOR, '', $absolutePath);

    // ✅ Ubah backslash Windows jadi forward slash (Linux friendly)
    $relativePath = str_replace('\\', '/', $relativePath);

    $zip->addFile($absolutePath, $relativePath);
    echo "📦 Menambahkan: $relativePath\n";
    $added++;
}

$zip->close();

if ($added > 0) {
    echo "\n✅ ZIP berhasil dibuat di: $zipFile\n";
    echo "Total file: $added\n";
} else {
    echo "⚠️ Tidak ada file PHP/JSON yang berubah.\n";
}
