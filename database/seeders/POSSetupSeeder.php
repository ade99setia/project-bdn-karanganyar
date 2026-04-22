<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class POSSetupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder creates:
     * - Role "kasir" if not exists
     * - Demo kasir users for each warehouse
     * - Demo admin user
     */
    public function run(): void
    {
        // 1. Create or get "kasir" role
        $kasirRole = Role::firstOrCreate(
            ['name' => 'kasir'],
            [
                'description' => 'Kasir POS - Dapat melakukan transaksi penjualan',
                'rank' => 3, // Adjust rank as needed
            ]
        );

        $this->command->info('✓ Role "kasir" created/verified');

        // 2. Get or create admin role
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            [
                'description' => 'Administrator - Full access',
                'rank' => 1,
            ]
        );

        $this->command->info('✓ Role "admin" created/verified');

        // 3. Get all warehouses
        $warehouses = Warehouse::all();

        if ($warehouses->isEmpty()) {
            $this->command->warn('⚠ No warehouses found. Creating demo warehouse...');
            
            $warehouse = Warehouse::create([
                'name' => 'Cabang Pusat',
                'address' => 'Jl. Contoh No. 123',
                'phone' => '021-12345678',
                'is_active' => true,
            ]);

            $warehouses = collect([$warehouse]);
            $this->command->info('✓ Demo warehouse created');
        }

        // 4. Create demo kasir for each warehouse
        foreach ($warehouses as $index => $warehouse) {
            $kasirNumber = str_pad($index + 1, 2, '0', STR_PAD_LEFT);
            
            $kasir = User::firstOrCreate(
                ['email' => "kasir{$kasirNumber}@example.com"],
                [
                    'name' => "Kasir {$warehouse->name}",
                    'phone' => '0812345678' . $kasirNumber,
                    'password' => Hash::make('password'), // Default password
                    'role_id' => $kasirRole->id,
                    'warehouse_id' => $warehouse->id,
                    'email_verified_at' => now(),
                ]
            );

            $this->command->info("✓ Kasir created: {$kasir->email} (password: password) - Warehouse: {$warehouse->name}");
        }

        // 5. Create demo admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin POS',
                'phone' => '081234567890',
                'password' => Hash::make('admin123'), // Admin password
                'role_id' => $adminRole->id,
                'warehouse_id' => null, // Admin can access all warehouses
                'email_verified_at' => now(),
            ]
        );

        $this->command->info("✓ Admin created: {$admin->email} (password: admin123)");

        // 6. Summary
        $this->command->info('');
        $this->command->info('=================================');
        $this->command->info('POS Setup Complete!');
        $this->command->info('=================================');
        $this->command->info('');
        $this->command->info('Login Credentials:');
        $this->command->info('');
        $this->command->info('Admin:');
        $this->command->info('  Email: admin@example.com');
        $this->command->info('  Password: admin123');
        $this->command->info('');
        
        foreach ($warehouses as $index => $warehouse) {
            $kasirNumber = str_pad($index + 1, 2, '0', STR_PAD_LEFT);
            $this->command->info("Kasir {$warehouse->name}:");
            $this->command->info("  Email: kasir{$kasirNumber}@example.com");
            $this->command->info("  Password: password");
            $this->command->info('');
        }
        
        $this->command->info('=================================');
    }
}
