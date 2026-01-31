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
        Schema::create('sales_visit_photos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sales_visit_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('file_path');
            $table->timestamp('taken_at')->nullable();

            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();

            $table->boolean('exif_checked')->default(false);
            $table->boolean('is_fake_gps')->default(false);

            $table->timestamps();

            // Index to optimize queries filtering by sales visit
            $table->index('sales_visit_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_visit_photos');
    }
};
