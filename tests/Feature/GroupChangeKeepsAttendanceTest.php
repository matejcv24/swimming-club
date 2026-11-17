<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\ClubParent;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A member who moves to another group keeps every training they attended before:
 * on the day itself, in the day overview and in their own history. Only days from
 * the move on list them in the new group.
 */
class GroupChangeKeepsAttendanceTest extends TestCase
{
    use RefreshDatabase;

    private function member(string $name, int $groupId): Member
    {
        $parent = ClubParent::create(['name' => 'Parent of '.$name, 'phone' => '070000000']);

        return Member::create(['name' => $name, 'group_id' => $groupId, 'status' => 'active', 'parent_id' => $parent->id]);
    }

    private function smallPoolCoach(): User
    {
        $coach = User::factory()->create(['role' => 'coach', 'all_groups' => false]);
        $coach->coachGroups()->sync([$this->group('Small pool')]);

        return $coach;
    }

    /** Ana trained in the small pool on 1 and 8 November, then moved to the big pool. */
    private function anaMovedToTheBigPool(User $admin): Member
    {
        $small = $this->group('Small pool');
        $ana = $this->member('Ana', $small);
        $bojan = $this->member('Bojan', $small);

        foreach (['2026-11-01', '2026-11-08'] as $date) {
            $this->actingAs($admin)
                ->post('/trainings', ['date' => $date, 'group_id' => $small, 'member_ids' => [$ana->id, $bojan->id]])
                ->assertSessionHasNoErrors();
        }

        $this->actingAs($admin)->put("/members/{$ana->id}", [
            'name' => 'Ana',
            'group_id' => $this->group('Big pool'),
            'status' => 'active',
            'parent_name' => 'Parent of Ana',
            'parent_phone' => '070000000',
        ])->assertSessionHasNoErrors();

        return $ana->fresh();
    }

    public function test_past_small_pool_days_still_list_the_member_who_moved()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $ana = $this->anaMovedToTheBigPool($admin);

        $this->actingAs($admin)
            ->getJson('/trainings/by-date?date=2026-11-01&group_id='.$this->group('Small pool'))
            ->assertOk()
            ->assertJsonCount(2, 'member_ids')
            ->assertJsonFragment(['id' => $ana->id, 'name' => 'Ana', 'group_id' => $this->group('Big pool')]);

        // The day overview and her own history keep both days too
        $this->actingAs($admin)
            ->getJson('/trainings/by-date?date=2026-11-01&summary=1')
            ->assertJsonPath('sections.0.group_id', $this->group('Small pool'))
            ->assertJsonFragment(['name' => 'Ana']);

        $this->actingAs($admin)
            ->getJson("/attendance/by-member/{$ana->id}")
            ->assertJsonCount(2, 'attendances');
    }

    public function test_the_small_pool_coach_can_still_edit_a_past_day_with_her_on_it()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $ana = $this->anaMovedToTheBigPool($admin);
        $bojan = Member::where('name', 'Bojan')->first();
        $small = $this->group('Small pool');

        // Unticking Bojan on 1 November keeps Ana's attendance that day
        $this->actingAs($this->smallPoolCoach())
            ->post('/trainings', ['date' => '2026-11-01', 'group_id' => $small, 'member_ids' => [$ana->id]])
            ->assertSessionHasNoErrors();

        $this->assertSame(1, Attendance::whereHas('training', fn ($q) => $q->whereDate('date', '2026-11-01'))->where('member_id', $ana->id)->count());
        $this->assertSame(0, Attendance::where('member_id', $bojan->id)->whereHas('training', fn ($q) => $q->whereDate('date', '2026-11-01'))->count());
        $this->assertSame(2, Attendance::where('member_id', $ana->id)->count());
    }

    public function test_coaches_still_cannot_add_members_of_other_groups_to_a_day()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $ana = $this->anaMovedToTheBigPool($admin);

        // 15 November: after the move, Ana isn't recorded there and isn't the coach's
        $this->actingAs($this->smallPoolCoach())
            ->post('/trainings', ['date' => '2026-11-15', 'group_id' => $this->group('Small pool'), 'member_ids' => [$ana->id]])
            ->assertForbidden();
    }
}
