<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Whether the club sends payment confirmations and unpaid-fee reminders by email.
 * Both on by default, so nothing changes for clubs that already send them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->boolean('payment_confirmation_emails')->default(true);
            $table->boolean('payment_reminder_emails')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn(['payment_confirmation_emails', 'payment_reminder_emails']);
        });
    }
};
