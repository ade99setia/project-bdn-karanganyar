<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [];

        for ($i = 1; $i <= 10; $i++) {
            $products[] = [
                'sku'        => 'PRD-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'name'       => 'Produk ' . $i,
                'file_path'  => 'products/' . $i . '.jpg',
                'description'=> 'Deskripsi singkat untuk Produk ' . $i,
                'category'   => 'Kategori ' . (($i % 3) + 1),
                'price'      => rand(50_000, 500_000),
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('products')->insert($products);
    }
}
