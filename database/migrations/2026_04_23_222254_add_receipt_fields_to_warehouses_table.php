<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('warehouses', function (Blueprint $table) {
            $table->string('address')->nullable()->after('file_path');
            $table->string('phone')->nullable()->after('address');
            $table->string('receipt_header')->nullable()->after('phone')
                ->comment('Teks tambahan di bawah nama toko pada struk');
            $table->string('receipt_footer')->nullable()->after('receipt_header')
                ->comment('Ucapan penutup di bagian bawah struk');
        });
    }

    public function down(): void
    {
        Schema::table('warehouses', function (Blueprint $table) {
            $table->dropColumn(['address', 'phone', 'receipt_header', 'receipt_footer']);
        });
    }
};
