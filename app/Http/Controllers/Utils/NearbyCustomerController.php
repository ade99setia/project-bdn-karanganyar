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

            $query = Customer::nearby($lat, $lng, $radiusKm);

            if (config('database.default') === 'mysql') {
                $query->limit(10);
            }

            $customers = $query->get();

            $customers = $customers->map(function ($customer) use ($lat, $lng) {

                if (isset($customer->distance)) {
                    $customer->distance = (float) $customer->distance;
                } else {
                    $customer->distance = $this->calculateHaversine($lat, $lng, $customer->lat, $customer->lng);
                }

                return $customer;
            });

            $customers = $customers
                ->filter(fn($c) => $c->distance <= $radiusKm)
                ->sortBy('distance')
                ->values()
                ->take(10);

            return response()->json($customers);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function calculateHaversine($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // KM

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 3);
    }
}
