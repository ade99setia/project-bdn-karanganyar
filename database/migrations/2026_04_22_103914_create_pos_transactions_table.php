<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pos_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number', 50)->unique();
            $table->foreignId('warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignId('cashier_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->foreignId('shift_id')->nullable()->constrained('cashier_shifts')->nullOnDelete();
            $table->decimal('subtotal', 15, 2);
            $table->decimal('total_discount', 15, 2)->default(0.00);
            $table->decimal('grand_total', 15, 2);
            $table->string('payment_method', 50)->default('cash');
            $table->decimal('cash_received', 15, 2)->nullable();
            $table->decimal('cash_change', 15, 2)->nullable();
            $table->string('status', 20)->default('completed');
            $table->timestamps();
            
            $table->index('transaction_number');
            $table->index('warehouse_id');
            $table->index('cashier_id');
            $table->index('member_id');
            $table->index('shift_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_transactions');
    }
};
