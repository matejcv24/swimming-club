<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Multi-club, step 2: every record of a club says which club it belongs to.
 *
 * All existing rows belong to the existing club, so nothing changes for it. The
 * column is added empty, filled, and only then made required, so no row is ever
 * left without its club. Nothing is deleted.
 */
return new class extends Migration
{
    /** The tables whose rows belong to one club. */
    public const TABLES = [
        'groups', 'parents', 'members', 'trainings', 'attendances', 'membership_fees',
        'invoices', 'salaries', 'invitations', 'payment_reminders', 'notifications',
    ];

    public function up(): void
    {
        $clubId = DB::table('clubs')->orderBy('id')->value('id');

        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreignId('club_id')->nullable()->after('id')->constrained()->restrictOnDelete();
            });

            if ($clubId) {
                DB::table($table)->whereNull('club_id')->update(['club_id' => $clubId]);
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreignId('club_id')->nullable(false)->change();
            });
        }
    }

    public function down(): void
    {
        foreach (array_reverse(self::TABLES) as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropConstrainedForeignId('club_id');
            });
        }
    }
};
