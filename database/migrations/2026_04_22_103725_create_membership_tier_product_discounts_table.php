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
        Schema::create('membership_tier_product_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_tier_id')->constrained('membership_tiers')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('discount_percentage', 5, 2);
            $table->timestamps();
            
            $table->unique(['membership_tier_id', 'product_id'], 'unique_tier_product');
            $table->index('membership_tier_id', 'idx_tier');
            $table->index('product_id', 'idx_product');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_tier_product_discounts');
    }
};
