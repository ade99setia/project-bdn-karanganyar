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
Schema::create('sales_gps_logs', function (Blueprint $table) {
    $table->id();

    $table->foreignId('user_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->timestamp('recorded_at');

    $table->decimal('lat', 10, 7);
    $table->decimal('lng', 10, 7);

    $table->float('accuracy')->nullable();
    $table->string('provider', 20)->nullable(); // gps / network / mock
    $table->boolean('is_mocked')->default(false);

    $table->timestamps();

    // Index to optimize queries filtering by user and recorded date
    $table->index(['user_id', 'recorded_at']);
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_gps_logs');
    }
};
