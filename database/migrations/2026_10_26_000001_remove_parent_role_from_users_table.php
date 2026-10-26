<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $parentIds = DB::table('users')->where('role', 'parent')->pluck('id');

        // Deleting a user cascades to their trainings (and attendance) and salaries.
        // Parent users should never own any; stop instead of losing real data.
        $ownsData = DB::table('trainings')->whereIn('coach_id', $parentIds)->exists()
            || DB::table('salaries')->whereIn('user_id', $parentIds)->exists();

        if ($ownsData) {
            throw new RuntimeException(
                'Some parent-role users own trainings or salaries. Nothing was deleted; '
                .'change their role or move that data before running this migration.'
            );
        }

        DB::table('notifications')
            ->where('notifiable_type', 'App\\Models\\User')
            ->whereIn('notifiable_id', $parentIds)
            ->delete();

        DB::table('users')->whereIn('id', $parentIds)->delete();

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('coach')->change(); // admin, coach
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('parent')->change();
        });
    }
};
