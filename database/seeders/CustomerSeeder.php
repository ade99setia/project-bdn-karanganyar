<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('id_ID');
        $customers = [];

        for ($i = 1; $i <= 10; $i++) {
            $customers[] = [
                'name'       => 'Toko ' . $faker->company,
                'phone'      => $faker->phoneNumber,
                'email'      => $faker->unique()->safeEmail,
                'notes'      => $faker->sentence,
                'address'    => $faker->address,
                'lat'        => $faker->latitude(-8, -6),
                'lng'        => $faker->longitude(106, 110),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('customers')->insert($customers);
    }
}
