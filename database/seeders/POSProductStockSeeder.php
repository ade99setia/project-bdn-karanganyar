<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class POSProductStockSeeder extends Seeder
{
    /**
     * Seed sample products with stock for POS testing
     */
    public function run(): void
    {
        $warehouses = Warehouse::all();

        if ($warehouses->isEmpty()) {
            $this->command->warn('⚠ No warehouses found. Please run POSSetupSeeder first.');
            return;
        }

        // Sample products for POS
        $sampleProducts = [
            [
                'name' => 'Indomie Goreng',
                'sku' => 'IDM-001',
                'price' => 3500,
                'description' => 'Mie instan rasa goreng',
            ],
            [
                'name' => 'Aqua 600ml',
                'sku' => 'AQA-001',
                'price' => 4000,
                'description' => 'Air mineral kemasan',
            ],
            [
                'name' => 'Teh Botol Sosro',
                'sku' => 'TBS-001',
                'price' => 5000,
                'description' => 'Teh dalam kemasan botol',
            ],
            [
                'name' => 'Kopi Kapal Api',
                'sku' => 'KKA-001',
                'price' => 2500,
                'description' => 'Kopi sachet',
            ],
            [
                'name' => 'Susu Ultra Milk',
                'sku' => 'ULM-001',
                'price' => 8000,
                'description' => 'Susu UHT kotak',
            ],
            [
                'name' => 'Roti Tawar Sari Roti',
                'sku' => 'SRT-001',
                'price' => 12000,
                'description' => 'Roti tawar kemasan',
            ],
            [
                'name' => 'Telur Ayam (10 butir)',
                'sku' => 'TEL-001',
                'price' => 25000,
                'description' => 'Telur ayam negeri',
            ],
            [
                'name' => 'Beras Premium 5kg',
                'sku' => 'BRS-001',
                'price' => 75000,
                'description' => 'Beras premium kualitas terbaik',
            ],
        ];

        $this->command->info('Creating sample products...');

        foreach ($sampleProducts as $productData) {
            $product = Product::firstOrCreate(
                ['sku' => $productData['sku']],
                [
                    'name' => $productData['name'],
                    'price' => $productData['price'],
                    'description' => $productData['description'],
                    'is_active' => true,
                ]
            );

            $this->command->info("✓ Product: {$product->name} ({$product->sku})");

            // Add stock to each warehouse
            foreach ($warehouses as $warehouse) {
                $stock = ProductStock::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'warehouse_id' => $warehouse->id,
                    ],
                    [
                        'quantity' => rand(50, 200), // Random stock between 50-200
                    ]
                );

                $this->command->info("  → Stock at {$warehouse->name}: {$stock->quantity} units");
            }
        }

        $this->command->info('');
        $this->command->info('=================================');
        $this->command->info('POS Product Stock Seeding Complete!');
        $this->command->info('=================================');
        $this->command->info('');
        $this->command->info('Sample products created:');
        foreach ($sampleProducts as $p) {
            $this->command->info("  • {$p['name']} - Rp " . number_format($p['price'], 0, ',', '.'));
        }
        $this->command->info('');
        $this->command->info('Stock added to all warehouses (50-200 units each)');
        $this->command->info('');
        $this->command->info('You can now test POS at /pos');
        $this->command->info('Login as kasir: kasir01@example.com / password');
        $this->command->info('=================================');
    }
}
