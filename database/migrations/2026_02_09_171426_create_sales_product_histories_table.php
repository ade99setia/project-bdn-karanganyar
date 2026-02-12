<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sales_product_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('product_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('sales_visit_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('status', 30);
            // offered | sold | rejected | follow_up

            $table->integer('quantity')->default(1);

            $table->string('notes')->nullable();
            $table->timestamp('recorded_at');

            $table->timestamps();

            $table->index(['product_id', 'recorded_at']);
            $table->index(['user_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_product_histories');
    }
};
