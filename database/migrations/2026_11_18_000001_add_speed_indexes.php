<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indexes for the lookups the app makes on every visit (a day's trainings, this
 * year's payments and salaries, active members, each member's latest fee). They
 * only speed up reading; no data is changed.
 */
return new class extends Migration
{
    /** [table, columns] */
    private const INDEXES = [
        ['trainings', ['date', 'group_id']],
        ['membership_fees', ['start_date']],
        ['membership_fees', ['member_id', 'end_date']],
        ['salaries', ['month']],
        ['members', ['status']],
    ];

    public function up(): void
    {
        foreach (self::INDEXES as [$table, $columns]) {
            if (! Schema::hasIndex($table, $columns)) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->index($columns));
            }
        }
    }

    public function down(): void
    {
        foreach (self::INDEXES as [$table, $columns]) {
            if (Schema::hasIndex($table, $columns)) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropIndex($columns));
            }
        }
    }
};
