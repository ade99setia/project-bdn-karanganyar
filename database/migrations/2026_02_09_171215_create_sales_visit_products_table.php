<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sales_visit_products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sales_visit_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained()
                ->restrictOnDelete();

            $table->integer('quantity')->default(1);

            $table->string('action_type', 30);
            // offered | sold | sample | returned

            $table->string('note')->nullable();

            $table->timestamps();

            $table->index('sales_visit_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_visit_products');
    }
};
