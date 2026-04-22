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
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('membership_tier_id')->constrained('membership_tiers')->restrictOnDelete();
            $table->string('member_number', 50)->unique();
            $table->string('name');
            $table->string('phone', 20);
            $table->string('email')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('member_number');
            $table->index('phone');
            $table->index('user_id');
            $table->index('membership_tier_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
