<?php

namespace App\Http\Controllers\Utils;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;

class NearbyCustomerController extends Controller
{
    public function __invoke(Request $request)
    {
        try {
            $validated = $request->validate([
                'lat' => 'required|numeric',
                'lng' => 'required|numeric',
            ]);

            $lat = (float) $validated['lat'];
            $lng = (float) $validated['lng'];
            $radiusKm = 2;

            if (!class_exists(Customer::class)) {
                throw new \Exception("Class App\\Models\\Customer tidak ditemukan.");
            }

            // Validasi koordinat customer tidak null untuk menghindari error di haversine
            $customers = Customer::nearby($lat, $lng, $radiusKm)
                ->whereNotNull('lat')
                ->whereNotNull('lng')
                ->limit(10)
                ->get();

            // Map dan format distance dari database haversine
            $customers = $customers->map(function ($customer) {
                $customer->distance = (float) ($customer->distance ?? 0);
                return $customer;
            });

            return response()->json($customers);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

}
