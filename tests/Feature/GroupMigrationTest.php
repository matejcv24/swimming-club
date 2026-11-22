<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Runs the groups migration against existing Big/Small pool data the way the
 * production deploy does: real migrations, not wrapped in a test transaction.
 */
class GroupMigrationTest extends TestCase
{
    use DatabaseMigrations;

    public function test_existing_pools_become_groups_when_migrating()
    {
        // Created while users have all their columns
        $coach = User::factory()->create(['role' => 'coach']);

        // Roll back to just before groups existed, add pool-based data, migrate again
        Artisan::call('migrate:rollback', ['--step' => 7]);

        $parentId = DB::table('parents')->insertGetId(['name' => 'P', 'phone' => '1', 'created_at' => now(), 'updated_at' => now()]);
        $bigMember = DB::table('members')->insertGetId(['name' => 'Big swimmer', 'pool' => 'big', 'status' => 'active', 'parent_id' => $parentId, 'created_at' => now(), 'updated_at' => now()]);
        $smallMember = DB::table('members')->insertGetId(['name' => 'Small swimmer', 'pool' => 'small', 'status' => 'active', 'parent_id' => $parentId, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('membership_fees')->insert(['member_id' => $smallMember, 'member_name' => 'Small swimmer', 'pool' => 'small', 'amount' => 1500, 'payment_method' => 'cash', 'start_date' => '2026-10-01', 'end_date' => '2026-10-31', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('invoices')->insert(['month' => '2026-10-01', 'pool' => 'big', 'amount' => 12000, 'created_at' => now(), 'updated_at' => now()]);
        $trainingId = DB::table('trainings')->insertGetId(['coach_id' => $coach->id, 'date' => '2026-10-20', 'pool' => 'small', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('attendances')->insert(['training_id' => $trainingId, 'member_id' => $smallMember, 'present' => true, 'created_at' => now(), 'updated_at' => now()]);

        // The club's one-off Small pool → Partizan move (tested on its own) needs a
        // Partizan group, which this pool-only database doesn't have
        DB::table('migrations')->insert([
            ['migration' => '2026_11_19_000001_move_small_pool_to_partizan', 'batch' => 99],
            ['migration' => '2026_11_19_000002_move_small_pool_fees_to_partizan', 'batch' => 99],
        ]);
        Artisan::call('migrate');

        $big = Group::where('name', 'Big pool')->value('id');
        $small = Group::where('name', 'Small pool')->value('id');

        // Every row survived the migration
        $this->assertSame(2, DB::table('members')->count());
        $this->assertSame(1, DB::table('membership_fees')->count());
        $this->assertSame(1, DB::table('invoices')->count());
        $this->assertSame(1, DB::table('trainings')->count());
        $this->assertSame(1, DB::table('attendances')->count());

        // ...and is linked to the matching group
        $this->assertSame(2, Group::count());
        $this->assertSame($big, (int) DB::table('members')->where('id', $bigMember)->value('group_id'));
        $this->assertSame($small, (int) DB::table('members')->where('id', $smallMember)->value('group_id'));
        $this->assertSame($small, (int) DB::table('membership_fees')->value('group_id'));
        $this->assertSame($big, (int) DB::table('invoices')->value('group_id'));
        $this->assertSame($small, (int) DB::table('trainings')->value('group_id'));

        // The old pool values are still there
        $this->assertSame('big', DB::table('members')->where('id', $bigMember)->value('pool'));
    }
}
