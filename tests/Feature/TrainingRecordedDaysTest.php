<?php

namespace Tests\Feature;

use App\Models\ClubParent;
use App\Models\Group;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrainingRecordedDaysTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_calendar_gets_the_days_with_recorded_attendance()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $small = $this->group('Small pool');
        $big = $this->group('Big pool');
        $evening = Group::create(['name' => '18:00', 'parent_id' => $small])->id;
        $parent = ClubParent::create(['name' => 'Parent', 'phone' => '070000000']);
        $ana = Member::create(['name' => 'Ana', 'group_id' => $small, 'status' => 'active', 'parent_id' => $parent->id]);
        $dime = Member::create(['name' => 'Dime', 'group_id' => $big, 'status' => 'active', 'parent_id' => $parent->id]);

        $record = fn (string $date, int $group, array $ids, ?int $subgroup = null) => $this->actingAs($admin)
            ->post('/trainings', ['date' => $date, 'group_id' => $group, 'subgroup_id' => $subgroup, 'member_ids' => $ids])
            ->assertSessionHasNoErrors();

        $record('2026-11-03', $small, [$ana->id], $evening);
        $record('2026-11-05', $small, [$ana->id]);
        $record('2026-11-05', $big, [$dime->id]);
        $record('2026-10-30', $small, [$ana->id]);

        $days = fn (string $query) => $this->actingAs($admin)->getJson('/trainings/days?month=2026-11'.$query)->assertOk()->json('days');

        $this->assertSame(['2026-11-03', '2026-11-05'], $days(''));
        $this->assertSame(['2026-11-03', '2026-11-05'], $days("&group_id={$small}"));
        $this->assertSame(['2026-11-03'], $days("&group_id={$small}&subgroup_id={$evening}"));
        $this->assertSame(['2026-11-05'], $days("&group_id={$big}"));
    }

    public function test_coaches_only_see_their_groups_days()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach', 'all_groups' => false]);
        $coach->coachGroups()->sync([$this->group('Small pool')]);
        $parent = ClubParent::create(['name' => 'Parent', 'phone' => '070000000']);
        $ana = Member::create(['name' => 'Ana', 'group_id' => $this->group('Small pool'), 'status' => 'active', 'parent_id' => $parent->id]);
        $dime = Member::create(['name' => 'Dime', 'group_id' => $this->group('Big pool'), 'status' => 'active', 'parent_id' => $parent->id]);
        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-03', 'group_id' => $this->group('Small pool'), 'member_ids' => [$ana->id]]);
        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-04', 'group_id' => $this->group('Big pool'), 'member_ids' => [$dime->id]]);

        // Without a group: the days of their own groups only
        $this->assertSame(['2026-11-03'], $this->actingAs($coach)->getJson('/trainings/days?month=2026-11')->assertOk()->json('days'));
        $this->actingAs($coach)->getJson('/trainings/days?month=2026-11&group_id='.$this->group('Big pool'))->assertForbidden();
        $this->actingAs($coach)->getJson('/trainings/days?month=2026-11&group_id='.$this->group('Small pool'))->assertOk();
    }
}
