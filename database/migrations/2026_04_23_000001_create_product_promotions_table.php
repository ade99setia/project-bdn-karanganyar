<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('membership_tier_id')->nullable()->constrained('membership_tiers')->cascadeOnDelete();
            $table->string('type')->default('bxgy'); // bxgy | bundle | etc.
            $table->integer('buy_quantity');          // X — jumlah yang harus dibeli
            $table->integer('free_quantity');         // Y — jumlah yang digratiskan
            $table->string('label')->nullable();      // Label tampilan, e.g. "Beli 3 Gratis 1"
            $table->boolean('is_active')->default(true);
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'is_active']);
            $table->index('membership_tier_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_promotions');
    }
};
