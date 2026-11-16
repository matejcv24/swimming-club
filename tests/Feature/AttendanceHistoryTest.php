<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\ClubParent;
use App\Models\Member;
use App\Models\Training;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AttendanceHistoryTest extends TestCase
{
    use RefreshDatabase;

    private function member(string $name, int $groupId): Member
    {
        $parent = ClubParent::create(['name' => 'Parent of '.$name, 'phone' => '070000000']);

        return Member::create(['name' => $name, 'group_id' => $groupId, 'status' => 'active', 'parent_id' => $parent->id]);
    }

    private function attend(Member $member, string $date, bool $present = true): void
    {
        $training = Training::create(['coach_id' => User::factory()->create(['role' => 'coach'])->id, 'date' => $date, 'group_id' => $member->group_id]);
        Attendance::create(['training_id' => $training->id, 'member_id' => $member->id, 'present' => $present]);
    }

    public function test_the_page_no_longer_sends_every_attendance()
    {
        $this->member('Ana', $this->group('Big pool'));

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/attendance')
            ->assertInertia(fn (Assert $page) => $page
                ->has('members', 1)
                ->missing('attendanceRows'));
    }

    public function test_a_members_history_is_their_present_days_newest_first()
    {
        $ana = $this->member('Ana', $this->group('Big pool'));
        $this->attend($ana, '2026-10-01');
        $this->attend($ana, '2026-10-08');
        $this->attend($ana, '2026-10-15', present: false);
        $this->attend($this->member('Bojan', $this->group('Big pool')), '2026-10-01');

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->getJson("/attendance/by-member/{$ana->id}")
            ->assertOk()
            ->assertJsonCount(2, 'attendances')
            ->assertJsonPath('attendances.0.date', '2026-10-08')
            ->assertJsonPath('attendances.1.date', '2026-10-01');
    }

    public function test_coaches_only_see_the_history_of_their_groups()
    {
        $coach = User::factory()->create(['role' => 'coach', 'all_groups' => false]);
        $coach->coachGroups()->sync([$this->group('Small pool')]);
        $big = $this->member('Big Bojan', $this->group('Big pool'));
        $small = $this->member('Small Ana', $this->group('Small pool'));

        $this->actingAs($coach)->getJson("/attendance/by-member/{$big->id}")->assertForbidden();
        $this->actingAs($coach)->getJson("/attendance/by-member/{$small->id}")->assertOk();
    }
}
