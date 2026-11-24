<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A member's own phone and email (for clubs whose members are adults), and
     * parents may share an email (two children, one parent).
     */
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->after('name');
            $table->string('email')->nullable()->after('phone');
        });

        Schema::table('parents', function (Blueprint $table) {
            $table->dropUnique(['email']);
        });
    }

    public function down(): void
    {
        Schema::table('parents', function (Blueprint $table) {
            $table->unique('email');
        });

        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn(['phone', 'email']);
        });
    }
};
