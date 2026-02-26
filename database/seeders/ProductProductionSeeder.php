<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductProductionSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // KK - Kerupuk
            [
                'name' => 'Kerupuk Tongkol (Berhadiah)',
                'sku' => 'KK-KT01',
                'category' => 'KK - Kerupuk',
                'description' => null,
                'file_path' => null,
                'price' => 17000,
                'is_active' => true,
            ],
            [
                'name' => 'Kerupuk Kemplang (Berhadiah)',
                'sku' => 'KK-KK01',
                'category' => 'KK - Kerupuk',
                'description' => null,
                'file_path' => null,
                'price' => 17000,
                'is_active' => true,
            ],

            // MR - Mie Kremes
            [
                'name' => 'Mie Kremes Merah',
                'sku' => 'MR-MKM01',
                'category' => 'MR - Mie Kremes',
                'description' => null,
                'file_path' => null,
                'price' => 5000,
                'is_active' => true,
            ],
            [
                'name' => 'Mie Kremes Hijau',
                'sku' => 'MR-MKH01',
                'category' => 'MR - Mie Kremes',
                'description' => null,
                'file_path' => null,
                'price' => 5000,
                'is_active' => true,
            ],

            // CM - Camilan Medan
            [
                'name' => 'Camilan Medan Balado Extra Pedas',
                'sku' => 'CM-CMB01',
                'category' => 'CM - Camilan Medan',
                'description' => null,
                'file_path' => null,
                'price' => 8000,
                'is_active' => true,
            ],
            [
                'name' => 'Camilan Medan Ori',
                'sku' => 'CM-CMO01',
                'category' => 'CM - Camilan Medan',
                'description' => null,
                'file_path' => null,
                'price' => 8000,
                'is_active' => true,
            ],

            // MO - Makaroni
            [
                'name' => 'Makaroni Balado Extra Pedas',
                'sku' => 'MO-MB01',
                'category' => 'MO - Makaroni',
                'description' => null,
                'file_path' => null,
                'price' => 8000,
                'is_active' => true,
            ],
            [
                'name' => 'Makaroni Ori',
                'sku' => 'MO-MO01',
                'category' => 'MO - Makaroni',
                'description' => null,
                'file_path' => null,
                'price' => 8000,
                'is_active' => true,
            ],

            // MK - Mie Kering Telur
            [
                'name' => 'Mie Telur Bogamie',
                'sku' => 'MK-MTB01',
                'category' => 'MK - Mie Kering Telur',
                'description' => null,
                'file_path' => null,
                'price' => 2250,
                'is_active' => true,
            ],

            // MI - Mie Instan
            [
                'name' => 'Mie Instan Mie Mu - Kuah Soto',
                'sku' => 'MI-MIKS01',
                'category' => 'MI - Mie Instan',
                'description' => null,
                'file_path' => null,
                'price' => 2250,
                'is_active' => true,
            ],
            [
                'name' => 'Mie Instan Mie Mu - Ayam Bawang',
                'sku' => 'MI-MIAB01',
                'category' => 'MI - Mie Instan',
                'description' => null,
                'file_path' => null,
                'price' => 2250,
                'is_active' => true,
            ],
            [
                'name' => 'Mie Instan Mie Mu - Goreng Spesial',
                'sku' => 'MI-MIGS01',
                'category' => 'MI - Mie Instan',
                'description' => null,
                'file_path' => null,
                'price' => 2250,
                'is_active' => true,
            ],

            // SP - Mie Gulung
            [
                'name' => 'Mie Gulung Jumbo 100 gr Cabe Hijau',
                'sku' => 'SP-MGCH01',
                'category' => 'SP - Mie Gulung',
                'description' => null,
                'file_path' => null,
                'price' => 4000,
                'is_active' => true,
            ],
            [
                'name' => 'Mie Gulung Jumbo 100 gr Pedas Asin',
                'sku' => 'SP-MGPA01',
                'category' => 'SP - Mie Gulung',
                'description' => null,
                'file_path' => null,
                'price' => 4000,
                'is_active' => true,
            ],
            [
                'name' => 'Mie Gulung Jumbo 100 gr Pedas Manis',
                'sku' => 'SP-MGPM01',
                'category' => 'SP - Mie Gulung',
                'description' => null,
                'file_path' => null,
                'price' => 4000,
                'is_active' => true,
            ],

            // SP - Keripik Singkong
            [
                'name' => 'Keripik Suno 20 gr Salty Original',
                'sku' => 'SP-KSSO01',
                'category' => 'SP - Keripik Singkong',
                'description' => null,
                'file_path' => null,
                'price' => 1665,
                'is_active' => true,
            ],
            [
                'name' => 'Keripik Suno 20 gr Balado',
                'sku' => 'SP-KSB01',
                'category' => 'SP - Keripik Singkong',
                'description' => null,
                'file_path' => null,
                'price' => 1665,
                'is_active' => true,
            ],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(
                ['sku' => $product['sku']],
                $product
            );
        }
    }
}