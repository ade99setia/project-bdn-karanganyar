<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('kiosk_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->boolean('active')->default(true);
            $table->timestamp('expired_at')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            $table->index(['active', 'expired_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kiosk_tokens');
    }
};
