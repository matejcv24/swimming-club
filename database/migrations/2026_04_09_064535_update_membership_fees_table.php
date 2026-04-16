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
        $table->dropColumn(['month', 'year', 'paid_at', 'paid']);
        $table->date('start_date')->after('amount');
        $table->date('end_date')->after('start_date');
    });
}

public function down(): void
{
    Schema::table('membership_fees', function (Blueprint $table) {
        $table->dropColumn(['start_date', 'end_date']);
        $table->integer('month');
        $table->integer('year');
        $table->date('paid_at')->nullable();
        $table->boolean('paid')->default(false);
    });
}
};
