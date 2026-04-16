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
    Schema::create('trainings', function (Blueprint $table) {
        $table->id();
        $table->foreignIdFor(\App\Models\User::class, 'coach_id')->constrained('users')->cascadeOnDelete();
        $table->date('date');
        $table->string('notes')->nullable();
        $table->timestamps();
    });
}
};
