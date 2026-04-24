<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_tier_product_discounts', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('discount_percentage');
            $table->date('valid_from')->nullable()->after('is_active');
            $table->date('valid_until')->nullable()->after('valid_from');
        });
    }

    public function down(): void
    {
        Schema::table('membership_tier_product_discounts', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'valid_from', 'valid_until']);
        });
    }
};
