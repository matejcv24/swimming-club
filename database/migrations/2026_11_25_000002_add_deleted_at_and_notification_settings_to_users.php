<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two new, empty columns on users; nothing existing changes.
 *  - deleted_at: a deleted staff account is only hidden (marked with this date).
 *    The row stays, so its trainings, salaries and history stay with it.
 *  - notification_settings: which notifications an admin wants (empty: all).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
            $table->json('notification_settings')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn('notification_settings');
        });
    }
};
