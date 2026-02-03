<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;

class UtilsController extends Controller
{
    public function reverseGeocode(Request $request)
    {
        $data = $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $client = new Client([
            'timeout' => 5,
            'headers' => [
                'User-Agent' => 'BDN-Karanganyar-App/1.0 (admin@bdn.idnsolo.com)',
            ],
        ]);

        try {
            $response = $client->get('https://nominatim.openstreetmap.org/reverse', [
                'query' => [
                    'format' => 'json',
                    'lat' => $data['lat'],
                    'lon' => $data['lng'],
                ],
            ]);

            $json = json_decode($response->getBody()->getContents(), true);
        } catch (\Throwable $e) {
            return response()->json([
                'address' => null,
            ]);
        }

        return response()->json([
            'address' => $json['display_name'] ?? null,
        ]);
    }
}
