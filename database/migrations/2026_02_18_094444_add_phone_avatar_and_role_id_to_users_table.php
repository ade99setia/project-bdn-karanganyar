<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->after('email_verified_at')->nullable();
            $table->string('avatar')->nullable()->after('phone');
            $table->foreignId('role_id')
                ->nullable()
                ->after('avatar')
                ->constrained('roles')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('phone');
            $table->dropColumn('avatar');
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
    }
};
