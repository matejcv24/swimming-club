<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\ClubParent;
use App\Models\Group;
use App\Models\Member;
use App\Models\Training;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MoveSmallPoolToPartizanTest extends TestCase
{
    use RefreshDatabase;

    private function runMove(): void
    {
        (require database_path('migrations/2026_11_19_000001_move_small_pool_to_partizan.php'))->up();
    }

    private function member(string $name, int $groupId, string $status = 'active', ?int $subgroupId = null): Member
    {
        $parent = ClubParent::create(['name' => 'Parent of '.$name, 'phone' => '070000000']);

        return Member::create(['name' => $name, 'group_id' => $groupId, 'subgroup_id' => $subgroupId, 'status' => $status, 'parent_id' => $parent->id]);
    }

    private function training(string $date, int $groupId, array $members, ?int $subgroupId = null): Training
    {
        $training = Training::create(['coach_id' => User::factory()->create()->id, 'date' => $date, 'group_id' => $groupId, 'subgroup_id' => $subgroupId]);
        foreach ($members as $member) {
            Attendance::create(['training_id' => $training->id, 'member_id' => $member->id, 'present' => true]);
        }

        return $training;
    }

    public function test_it_moves_trainings_from_18_october_and_active_members()
    {
        $small = $this->group('Small pool');
        $partizan = Group::create(['name' => 'Partizan', 'position' => 3])->id;
        $evening = Group::create(['name' => '18:00', 'parent_id' => $small])->id;

        $ana = $this->member('Ana', $small);
        $bojan = $this->member('Bojan', $small, 'active', $evening);
        $ceca = $this->member('Ceca', $small, 'inactive');
        $dime = $this->member('Dime', $this->group('Big pool'));

        $before = $this->training('2026-10-17', $small, [$ana, $ceca]);
        $first = $this->training('2026-10-18', $small, [$ana, $ceca]);
        $sub = $this->training('2026-11-03', $small, [$bojan], $evening);
        $big = $this->training('2026-11-03', $this->group('Big pool'), [$dime]);

        // Partizan already trained on 10 November: the two days merge
        $this->training('2026-11-10', $partizan, [$ana]);
        $this->training('2026-11-10', $small, [$ana, $bojan]);

        $this->runMove();

        $this->assertSame($small, $before->fresh()->group_id);
        $this->assertSame($partizan, $first->fresh()->group_id);
        $this->assertSame(2, $first->attendances()->count());
        $this->assertSame([$partizan, null], [$sub->fresh()->group_id, $sub->fresh()->subgroup_id]);
        $this->assertSame($this->group('Big pool'), $big->fresh()->group_id);

        $merged = Training::whereDate('date', '2026-11-10')->get();
        $this->assertCount(1, $merged);
        $this->assertSame($partizan, $merged[0]->group_id);
        $this->assertEqualsCanonicalizing([$ana->id, $bojan->id], $merged[0]->attendances()->pluck('member_id')->all());

        $this->assertSame([$partizan, null], [$ana->fresh()->group_id, $ana->fresh()->subgroup_id]);
        $this->assertSame([$partizan, null], [$bojan->fresh()->group_id, $bojan->fresh()->subgroup_id]);
        $this->assertSame($small, $ceca->fresh()->group_id);
        $this->assertSame($this->group('Big pool'), $dime->fresh()->group_id);

        // Every attendance survives except the one duplicate on 10 November
        $this->assertSame(8, Attendance::count());
    }

    public function test_it_changes_nothing_if_partizan_is_missing()
    {
        $ana = $this->member('Ana', $this->group('Small pool'));

        try {
            $this->runMove();
            $this->fail('The move should stop without a Partizan group.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Partizan', $e->getMessage());
        }

        $this->assertSame($this->group('Small pool'), $ana->fresh()->group_id);
    }
}
