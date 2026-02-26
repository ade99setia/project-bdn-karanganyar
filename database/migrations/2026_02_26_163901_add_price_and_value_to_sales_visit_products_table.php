<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_visit_products', function (Blueprint $table) {

            $table->unsignedInteger('price')
                ->nullable()
                ->after('quantity')
                ->comment('Snapshot harga satuan saat transaksi');

            $table->bigInteger('value')
                ->nullable()
                ->after('price')
                ->comment('Total nilai transaksi (price x quantity)');

            $table->index('price');
        });
    }

    public function down(): void
    {
        Schema::table('sales_visit_products', function (Blueprint $table) {
            $table->dropIndex(['price']);
            $table->dropColumn(['price', 'value']);
        });
    }
};