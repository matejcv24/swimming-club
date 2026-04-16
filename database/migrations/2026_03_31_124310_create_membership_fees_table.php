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
    Schema::create('membership_fees', function (Blueprint $table) {
        $table->id();
        $table->foreignIdFor(\App\Models\Member::class)->constrained()->cascadeOnDelete();
        $table->decimal('amount', 8, 2);
        $table->integer('month');
        $table->integer('year');
        $table->date('paid_at')->nullable();
        $table->boolean('paid')->default(false);
        $table->timestamps();
    });
}
};
