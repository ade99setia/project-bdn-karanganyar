<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {

            $table->id();

            // Relasi ke user
            $table->foreignId('user_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            // Relasi ke supervisor (self reference)
            $table->foreignId('supervisor_id')
                ->nullable()
                ->constrained('employees')
                ->nullOnDelete();

            $table->string('nip')->nullable()->unique();

            $table->enum('status', ['active', 'inactive', 'resign'])
                ->default('active');

            $table->date('join_date')->nullable();
            $table->string('division')->nullable();
            $table->string('position')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
