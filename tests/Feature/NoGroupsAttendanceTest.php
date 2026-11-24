<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\Member;
use App\Models\Training;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** A club that hasn't made any groups records attendance on "All groups". */
class NoGroupsAttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The database starts with the first club's two groups: none here
        Group::query()->delete();
    }

    public function test_a_club_without_groups_records_attendance_for_everyone()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $ana = Member::create(['name' => 'Ana', 'status' => 'active']);
        $bojan = Member::create(['name' => 'Bojan', 'status' => 'active']);

        $this->actingAs($admin)->post('/trainings', [
            'date' => '2026-11-20', 'group_id' => null, 'member_ids' => [$ana->id, $bojan->id],
        ])->assertSessionHasNoErrors();

        $training = Training::sole();
        $this->assertNull($training->group_id);

        // The day can be opened and changed again
        $this->actingAs($admin)->getJson('/trainings/by-date?date=2026-11-20')
            ->assertOk()
            ->assertJsonPath('member_ids', [$ana->id, $bojan->id]);

        $this->actingAs($admin)->post('/trainings', [
            'date' => '2026-11-20', 'group_id' => null, 'member_ids' => [$ana->id],
        ])->assertSessionHasNoErrors();
        $this->assertSame(1, Training::count());
        $this->assertSame([$ana->id], $training->attendances()->pluck('member_id')->all());

        // The calendar's dot and the overview know the day
        $this->actingAs($admin)->getJson('/trainings/days?month=2026-11')->assertJsonPath('days', ['2026-11-20']);
        $this->actingAs($admin)->getJson('/trainings/by-date?date=2026-11-20&summary=1')
            ->assertJsonPath('sections.0.group_id', null)
            ->assertJsonCount(1, 'sections.0.members');
    }

    public function test_once_the_club_has_groups_attendance_needs_a_group()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Group::create(['name' => 'Beginners']);
        $member = Member::create(['name' => 'Ana', 'status' => 'active']);

        $this->actingAs($admin)->post('/trainings', [
            'date' => '2026-11-20', 'group_id' => null, 'member_ids' => [$member->id],
        ])->assertSessionHasErrors('group_id');

        $this->assertSame(0, Training::count());
    }

    public function test_a_coach_of_only_some_groups_cannot_record_for_everyone()
    {
        $group = Group::create(['name' => 'Beginners']);
        $coach = User::factory()->create(['role' => 'coach', 'all_groups' => false]);
        $coach->coachGroups()->sync([$group->id]);
        $member = Member::create(['name' => 'Ana', 'status' => 'active', 'group_id' => $group->id]);
        // The club's only group is deleted: no groups left
        $group->delete();

        $this->actingAs($coach)->post('/trainings', [
            'date' => '2026-11-20', 'group_id' => null, 'member_ids' => [$member->id],
        ])->assertForbidden();
    }

    public function test_without_groups_the_calendar_marks_only_days_with_everyones_attendance()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = Member::create(['name' => 'Ana', 'status' => 'active']);
        // Attendance once recorded under a group that has since been deleted
        $old = Group::create(['name' => 'Old group']);
        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $old->id, 'member_ids' => [$member->id]]);
        $old->delete();

        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-20', 'group_id' => null, 'member_ids' => [$member->id]])
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)->getJson('/trainings/days?month=2026-11&no_group=1')->assertJsonPath('days', ['2026-11-20']);
    }
}
