<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * One-off data move asked for by the club (17.11.2026), following the move of
 * Small pool's trainings and members to Partizan: membership fees paid for
 * "Small pool" for October and November 2026 (their period starts in one of
 * those months) now count for "Partizan". Other months keep their group.
 *
 * Only the fees' group changes; amounts, dates and members stay as they are.
 * The database backup taken before the deploy is the way back.
 */
return new class extends Migration
{
    private const FROM = 'Small pool';

    private const TO = 'Partizan';

    public function up(): void
    {
        $from = $this->mainGroup(self::FROM);

        $fees = DB::table('membership_fees')
            ->where('group_id', $from)
            ->whereBetween('start_date', ['2026-10-01', '2026-11-30']);

        // A fresh database (tests, a new install) has nothing to move
        if (! $fees->exists()) {
            return;
        }

        $moved = $fees->update(['group_id' => $this->mainGroup(self::TO), 'updated_at' => now()]);

        Log::info('Small pool → Partizan fees (Oct–Nov 2026)', ['fees_moved' => $moved]);
    }

    public function down(): void
    {
        // A data move can't be told apart from later changes: restore the backup
    }

    /** The id of the one current main group with this name, or stop. */
    private function mainGroup(string $name): int
    {
        $ids = DB::table('groups')
            ->where('name', $name)
            ->whereNull('parent_id')
            ->whereNull('deleted_at')
            ->pluck('id');

        if ($ids->count() !== 1) {
            throw new RuntimeException("Expected exactly one group named \"{$name}\", found {$ids->count()}. Nothing was changed.");
        }

        return $ids->first();
    }
};
