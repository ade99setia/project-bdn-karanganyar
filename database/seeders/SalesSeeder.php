<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SalesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder creates:
     * - Role "sales" if not exists
     * - Demo sales users with employee records
     */
    public function run(): void
    {
        // 1. Create or get "sales" role
        $salesRole = Role::firstOrCreate(
            ['name' => 'sales'],
            [
                'description' => 'Sales Delivery - Kunjungan dan pengiriman barang ke pelanggan',
                'rank' => 4,
            ]
        );

        $this->command->info('✓ Role "sales" created/verified');

        // 2. Create demo sales users
        for ($i = 1; $i <= 3; $i++) {
            $salesNumber = str_pad($i, 2, '0', STR_PAD_LEFT);
            
            $user = User::firstOrCreate(
                ['email' => "sales{$salesNumber}@example.com"],
                [
                    'name' => "Sales {$i}",
                    'phone' => '0812345678' . $salesNumber,
                    'password' => Hash::make('password'), // Default password
                    'role_id' => $salesRole->id,
                    'warehouse_id' => null, // Sales tidak terikat warehouse
                    'email_verified_at' => now(),
                ]
            );

            // Create employee record (required for sales)
            $employee = Employee::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'status' => 'active',
                    'join_date' => now()->subMonths(rand(1, 12)),
                ]
            );

            $this->command->info("✓ Sales created: {$user->email} (password: password) - Status: {$employee->status}");
        }

        // 3. Summary
        $this->command->info('');
        $this->command->info('=================================');
        $this->command->info('Sales Setup Complete!');
        $this->command->info('=================================');
        $this->command->info('');
        $this->command->info('Login Credentials:');
        $this->command->info('');
        
        for ($i = 1; $i <= 3; $i++) {
            $salesNumber = str_pad($i, 2, '0', STR_PAD_LEFT);
            $this->command->info("Sales {$i}:");
            $this->command->info("  Email: sales{$salesNumber}@example.com");
            $this->command->info("  Password: password");
            $this->command->info('');
        }
        
        $this->command->info('=================================');
        $this->command->info('');
        $this->command->info('Next steps:');
        $this->command->info('1. Assign stok produk ke sales (via Settings > Stockist)');
        $this->command->info('2. Assign sales ke area (optional)');
        $this->command->info('3. Sales dapat login dan mulai check-in');
        $this->command->info('');
    }
}
