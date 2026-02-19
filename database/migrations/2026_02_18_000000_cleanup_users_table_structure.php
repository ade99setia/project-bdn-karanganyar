<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {

            // Hapus kolom yang tidak diperlukan lagi
            if (Schema::hasColumn('users', 'nip')) {
                $table->dropColumn('nip');
            }

            if (Schema::hasColumn('users', 'phone')) {
                $table->dropColumn('phone');
            }

        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {

            $table->string('nip')->nullable();
            $table->string('phone')->nullable();

        });
    }
};
