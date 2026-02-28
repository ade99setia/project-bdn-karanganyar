<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\SalesAttendance;
use App\Models\SalesVisit;
use App\Models\SalesVisitPhoto;
use App\Models\Customer; // Pastikan Model Customer di-import
use App\Models\SalesProductStock;
use App\Models\StockMovement;

class SalesVisitController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validasi input
        $validated = $request->validate([
            // --- Validasi Visit Basic ---
            'activity_type' => 'required|string|in:kunjungan,pengiriman',
            'description'   => 'nullable|string',
            'lat'           => 'required|numeric',
            'lng'           => 'required|numeric',
            'address'       => 'nullable|string',
            'photo'         => 'required|image|max:10240', // Max 10MB

            // --- Validasi Array Produk ---
            'products'               => 'required_if:activity_type,pengiriman|array|min:1',
            'products.*.product_id'  => 'required|exists:products,id',
            'products.*.quantity'    => 'required|integer|min:1',
            'products.*.action_type' => 'required|string|in:terjual,retur,sold,returned',
            'products.*.price'       => 'nullable|integer|min:0',
            'products.*.value'       => 'nullable|integer',
            'products.*.note'        => 'nullable|string',

            // --- Validasi Customer ---
            'customer_mode' => 'required|in:database,manual',
            'customer_id'   => 'nullable|required_if:customer_mode,database|exists:customers,id',
            'customer_name' => 'nullable|required_if:customer_mode,manual|string|max:255',
            'customer_note' => 'nullable|string|max:500',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email|max:100',
        ]);

        $user  = Auth::user();
        $today = now()->toDateString();

        // 2. Pastikan sudah check-in
        $attendance = SalesAttendance::where('user_id', $user->id)
            ->whereDate('work_date', $today)
            ->first();

        if (!$attendance) {
            return back()->withErrors(['message' => 'Anda harus check-in presensi terlebih dahulu.']);
        }

        // 3. Mulai Transaksi Database
        try {
            DB::transaction(function () use ($validated, $user, $attendance, $request) {

                $lat = $validated['lat'];
                $lng = $validated['lng'];
                $address = $validated['address'] ?? "Koordinat: {$lat}, {$lng}";

                // === A. LOGIKA PENENTUAN CUSTOMER ===
                $customerId = null;

                if ($request->customer_mode === 'manual') {
                    $newCustomer = Customer::create([
                        'name'    => $request->customer_name,
                        'address' => $address,
                        'lat'     => $lat,
                        'lng'     => $lng,
                        'notes'   => $request->customer_note ?? 'Dibuat saat kunjungan sales (Manual)',
                        'phone'   => $request->customer_phone ?? null,
                        'email'   => $request->customer_email ?? null,
                    ]);

                    $customerId = $newCustomer->id;
                } else {
                    $customerId = $request->customer_id;
                }

                // === B. SIMPAN VISIT ===
                $visit = SalesVisit::create([
                    'user_id'             => $user->id,
                    'sales_attendance_id' => $attendance->id,
                    'customer_id'         => $customerId, // Gunakan ID dari logika di atas
                    'activity_type'       => $validated['activity_type'],
                    'description'         => $validated['description'] ?? null,
                    'visited_at'          => now(),
                    'lat'                 => $lat,
                    'lng'                 => $lng,
                    'address'             => $address,
                    'is_fake_gps'         => false,
                    'fake_gps_score'      => 0,
                ]);

                // === C. SIMPAN FOTO ===
                if ($request->hasFile('photo')) {
                    $file = $request->file('photo');
                    $path = $file->store('visit-photos/' . $user->id, 'public');

                    SalesVisitPhoto::create([
                        'sales_visit_id' => $visit->id,
                        'file_path'      => $path,
                        'taken_at'       => now(),
                        'lat'            => $lat,
                        'lng'            => $lng,
                        'exif_checked'   => true,
                        'is_fake_gps'    => false,
                    ]);
                }

                // === D. SIMPAN PRODUK ===
                if (!empty($validated['products'])) {
                    $warehouseId = $user->warehouse_id;

                    foreach ($validated['products'] as $item) {
                        $normalizedAction = match ($item['action_type']) {
                            'sold' => 'terjual',
                            'returned' => 'retur',
                            default => $item['action_type'],
                        };

                        $price = (int) ($item['price'] ?? 0);
                        $calculatedValue = $price * (int) $item['quantity'];
                        $signedValue = $normalizedAction === 'retur' ? -abs($calculatedValue) : abs($calculatedValue);

                        $visit->products()->attach($item['product_id'], [
                            'quantity'    => $item['quantity'],
                            'price'       => $price,
                            'value'       => (int) ($item['value'] ?? $signedValue),
                            'action_type' => $normalizedAction,
                            'note'        => $item['note'] ?? null,
                            'created_at'  => now(),
                            'updated_at'  => now(),
                        ]);

                        if ($validated['activity_type'] !== 'pengiriman') {
                            continue;
                        }

                        $stock = SalesProductStock::query()
                            ->where('user_id', $user->id)
                            ->where('product_id', $item['product_id'])
                            ->lockForUpdate()
                            ->first();

                        if (!$stock) {
                            $stock = SalesProductStock::create([
                                'user_id' => $user->id,
                                'product_id' => $item['product_id'],
                                'quantity' => 0,
                            ]);
                            $stock = $stock->fresh();
                        }

                        $quantity = (int) $item['quantity'];

                        if ($normalizedAction === 'terjual') {
                            if ($stock->quantity < $quantity) {
                                throw new \Exception("Stok tidak cukup untuk produk ID {$item['product_id']}");
                            }

                            $stock->decrement('quantity', $quantity);

                            StockMovement::create([
                                'product_id' => $item['product_id'],
                                'warehouse_id' => $warehouseId,
                                'sales_visit_id' => $visit->id,
                                'user_id' => $user->id,
                                'type' => 'out',
                                'quantity' => $quantity,
                                'reference' => 'VISIT-' . $visit->id,
                                'note' => $item['note'] ?? null,
                            ]);
                        } elseif ($normalizedAction === 'retur') {
                            $stock->increment('quantity', $quantity);

                            StockMovement::create([
                                'product_id' => $item['product_id'],
                                'warehouse_id' => $warehouseId,
                                'sales_visit_id' => $visit->id,
                                'user_id' => $user->id,
                                'type' => 'in',
                                'quantity' => $quantity,
                                'reference' => 'VISIT-' . $visit->id,
                                'note' => $item['note'] ?? null,
                            ]);
                        }
                    }
                }
            });

            return redirect()->back()->with('success', 'Laporan kunjungan & data pelanggan berhasil disimpan.');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Gagal menyimpan laporan: ' . $e->getMessage()]);
        }
    }

    public function updateContact(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
        ]);

        $customer = Customer::findOrFail($id);
        $customer->update($validated);

        return redirect()->back()->with('success', 'Data pelanggan berhasil diperbarui.');
    }
}
