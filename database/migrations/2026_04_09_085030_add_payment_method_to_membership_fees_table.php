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
    Schema::table('membership_fees', function (Blueprint $table) {
        $table->enum('payment_method', ['cash', 'card'])->default('cash')->after('amount');
    });
}

public function down(): void
{
    Schema::table('membership_fees', function (Blueprint $table) {
        $table->dropColumn('payment_method');
    });
}
};
