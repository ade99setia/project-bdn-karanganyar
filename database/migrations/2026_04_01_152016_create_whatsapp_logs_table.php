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
        Schema::create('whatsapp_logs', function (Blueprint $table) {
            $table->id();
            $table->string('device')->nullable();
            $table->string('sender')->nullable();
            $table->string('sender_name')->nullable();
            $table->string('type')->nullable();
            $table->string('keyword')->nullable();
            $table->text('message')->nullable();
            $table->json('payload')->nullable();
            $table->integer('http_status')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_logs');
    }
};
