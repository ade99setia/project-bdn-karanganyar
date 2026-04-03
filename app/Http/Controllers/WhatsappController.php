<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\EvolutionApiService;

class WhatsappController extends Controller
{
    protected EvolutionApiService $waService;

    // Inject Service via constructor
    public function __construct(EvolutionApiService $waService)
    {
        $this->waService = $waService;
    }

    public function sendText(Request $request)
    {
        // 1. Ambil data dari request, atau gunakan default untuk testing
        $number = $request->input('number', '6285728473920'); 
        $text   = $request->input('text', 'Halo! Ini testing dari Laravel Service.');

        // 2. Eksekusi Request melalui Service
        $result = $this->waService->sendText($number, $text);

        // 3. Kembalikan Response untuk React frontend
        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'WhatsApp terkirim via Evolution API!',
                'data'    => $result['data']
            ], 200);
        }

        return response()->json([
            'success' => false,
            'message' => 'Gagal di Gateway Evolution',
            'error'   => $result['error']
        ], $result['status'] === 0 ? 500 : $result['status']); // Pastikan status HTTP valid
    }

    public function sendMedia(Request $request)
    {
        // 1. HARDCODE DATA (Sama seperti PHP murni Anda)
        $number  = "6285728473920";
        $caption = "Halo! Ini adalah contoh pengiriman *GAMBAR* otomatis dari Laravel Service 🖼️";
        
        // 2. AMBIL FILE LOKAL DARI FOLDER PUBLIC LARAVEL
        $filePath = public_path('images/tech-verse-0.jpg');
        // $filePath = storage_path('app/public/soals/11/soal_692950095f4fc.png');

        // Cek apakah file benar-benar ada
        if (!file_exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'File lokal tidak ditemukan di: ' . $filePath
            ], 404);
        }

        // 3. EKSEKUSI SERVICE (Service ini otomatis akan mengubahnya ke base64)
        $result = $this->waService->sendMedia($number, $filePath, $caption);

        // 4. KEMBALIKAN RESPONSE KE REACT
        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'Media berhasil terkirim!',
                'data'    => $result['data']
            ], 200);
        }

        return response()->json([
            'success' => false,
            'message' => 'Gagal di Gateway',
            'error'   => $result['error']
        ], $result['status'] === 0 ? 500 : $result['status']);
    }
}