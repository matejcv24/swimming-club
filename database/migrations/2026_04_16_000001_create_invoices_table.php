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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->date('month');
            $table->enum('pool', ['big', 'small']);
            $table->decimal('amount', 8, 2);
            $table->timestamps();
            
            // Unique constraint: only one invoice per month/pool combination
            $table->unique(['month', 'pool']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
