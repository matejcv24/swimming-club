<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which payment emails the club sends, and which go out by themselves.
 *
 * - payment_confirmation_emails / payment_reminder_emails: the club sends them
 *   at all (on by default, so nothing changes for clubs that already send them)
 * - auto_payment_confirmation: sent as soon as a payment is saved (off by default)
 * - auto_payment_reminder: sent once a day to whoever is newly late (off by default)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->boolean('payment_confirmation_emails')->default(true);
            $table->boolean('payment_reminder_emails')->default(true);
            $table->boolean('auto_payment_confirmation')->default(false);
            $table->boolean('auto_payment_reminder')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn([
                'payment_confirmation_emails',
                'payment_reminder_emails',
                'auto_payment_confirmation',
                'auto_payment_reminder',
            ]);
        });
    }
};
