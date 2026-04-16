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
    Schema::create('attendances', function (Blueprint $table) {
        $table->id();
        $table->foreignIdFor(\App\Models\Training::class)->constrained()->cascadeOnDelete();
        $table->foreignIdFor(\App\Models\Member::class)->constrained()->cascadeOnDelete();
        $table->boolean('present')->default(false);
        $table->timestamps();
    });
}
};
