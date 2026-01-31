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
        Schema::create('sales_attendances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->date('work_date');

            $table->timestamp('check_in_at')->nullable();
            $table->timestamp('check_out_at')->nullable();

            $table->decimal('check_in_lat', 11, 8)->nullable();
            $table->decimal('check_in_lng', 11, 8)->nullable();
            $table->decimal('check_out_lat', 11, 8)->nullable();
            $table->decimal('check_out_lng', 11, 8)->nullable();

            $table->string('check_in_address')->nullable();
            $table->string('check_out_address')->nullable();

            $table->string('device_id')->nullable();

            $table->boolean('is_fake_gps')->default(false);
            $table->string('fake_gps_note')->nullable();

            $table->timestamps();

            // Add unique constraint to prevent multiple attendance records for the same user on the same date
            $table->unique(['user_id', 'work_date']);
            $table->index('work_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_attendances');
    }
};
