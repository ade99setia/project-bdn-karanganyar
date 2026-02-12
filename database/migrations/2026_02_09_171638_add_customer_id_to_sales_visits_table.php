<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sales_visits', function (Blueprint $table) {
            $table->foreignId('customer_id')
                ->nullable()
                ->after('sales_attendance_id')
                ->constrained()
                ->nullOnDelete();

            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::table('sales_visits', function (Blueprint $table) {
            if (Schema::hasColumn('sales_visits', 'customer_id')) {
                $table->dropForeign(['customer_id']);
                $table->dropIndex(['customer_id']);
                $table->dropColumn('customer_id');
            }
        });
    }
};
