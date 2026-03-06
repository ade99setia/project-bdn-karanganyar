<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->foreignId('announcement_id')
                ->nullable()
                ->after('user_id')
                ->constrained('announcements')
                ->nullOnDelete();

            $table->index('announcement_id');
        });
    }

    public function down(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropForeign(['announcement_id']);
            $table->dropIndex(['announcement_id']);
            $table->dropColumn('announcement_id');
        });
    }
};
