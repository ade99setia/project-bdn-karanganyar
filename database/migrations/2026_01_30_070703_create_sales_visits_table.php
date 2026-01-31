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
        Schema::create('sales_visits', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('sales_attendance_id')
                ->constrained('sales_attendances')
                ->cascadeOnDelete();

            $table->string('activity_type', 50);
            $table->text('description')->nullable();

            $table->timestamp('visited_at');

            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->string('address')->nullable();

            $table->boolean('is_fake_gps')->default(false);
            $table->unsignedTinyInteger('fake_gps_score')->default(0);

            $table->timestamps();

            // Index to optimize queries filtering by user and visit date
            $table->index(['user_id', 'visited_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_visits');
    }
};
