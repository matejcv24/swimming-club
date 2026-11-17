<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * One-off data move asked for by the club (17.11.2026):
 *
 *  - every training recorded for "Small pool" from 18.10.2026 on now belongs to
 *    "Partizan", with all its attendance. If Partizan already has a training on
 *    that day, the attendance is merged into it (nobody is counted twice);
 *  - every active member of "Small pool" now trains in "Partizan".
 *
 * Partizan has no Small pool subgroups, so moved trainings and members become
 * whole-group ones. Inactive members, trainings before 18.10.2026, membership
 * fees and invoices keep their group. Nothing else is deleted: only an emptied
 * Small pool training whose attendance was merged into Partizan's same day.
 *
 * It all happens in one transaction: if anything fails, nothing changes. The
 * database backup taken before the deploy is the way back.
 */
return new class extends Migration
{
    private const FROM = 'Small pool';

    private const TO = 'Partizan';

    private const SINCE = '2026-10-18';

    public function up(): void
    {
        $from = $this->mainGroup(self::FROM);

        // The source group and its subgroups (trainings may be for one subgroup)
        $fromIds = DB::table('groups')->where('id', $from)->orWhere('parent_id', $from)->pluck('id');

        // A fresh database (tests, a new install) has nothing to move
        $nothingToMove = ! DB::table('trainings')->whereIn('group_id', $fromIds)->whereDate('date', '>=', self::SINCE)->exists()
            && ! DB::table('members')->where('group_id', $from)->where('status', 'active')->exists();
        if ($nothingToMove) {
            return;
        }

        $to = $this->mainGroup(self::TO);

        DB::transaction(function () use ($from, $to, $fromIds) {
            $moved = $merged = 0;

            $trainings = DB::table('trainings')
                ->whereIn('group_id', $fromIds)
                ->whereDate('date', '>=', self::SINCE)
                ->orderBy('date')->orderBy('id')
                ->get(['id', 'date']);

            foreach ($trainings as $training) {
                $target = DB::table('trainings')
                    ->where('group_id', $to)
                    ->whereNull('subgroup_id')
                    ->whereDate('date', $training->date)
                    ->where('id', '!=', $training->id)
                    ->value('id');

                if (! $target) {
                    DB::table('trainings')->where('id', $training->id)
                        ->update(['group_id' => $to, 'subgroup_id' => null, 'updated_at' => now()]);
                    $moved++;

                    continue;
                }

                // Partizan already trained that day: bring the attendance over, once each
                $already = DB::table('attendances')->where('training_id', $target)->pluck('member_id');
                DB::table('attendances')->where('training_id', $training->id)
                    ->whereNotIn('member_id', $already)
                    ->update(['training_id' => $target, 'updated_at' => now()]);
                DB::table('attendances')->where('training_id', $training->id)->delete();
                DB::table('trainings')->where('id', $training->id)->delete();
                $merged++;
            }

            $members = DB::table('members')
                ->where('group_id', $from)
                ->where('status', 'active')
                ->update(['group_id' => $to, 'subgroup_id' => null, 'updated_at' => now()]);

            Log::info('Small pool → Partizan', [
                'trainings_moved' => $moved,
                'trainings_merged' => $merged,
                'members_moved' => $members,
            ]);
        });
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
