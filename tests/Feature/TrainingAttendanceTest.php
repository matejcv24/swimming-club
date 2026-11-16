<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\ClubParent;
use App\Models\Member;
use App\Models\Training;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrainingAttendanceTest extends TestCase
{
    use RefreshDatabase;

    private function member(string $name): Member
    {
        $parent = ClubParent::create(['name' => 'Parent of '.$name, 'phone' => '070000000']);

        return Member::create(['name' => $name, 'group_id' => $this->group('Small pool'), 'status' => 'active', 'parent_id' => $parent->id]);
    }

    public function test_unticking_everyone_clears_the_days_attendance()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $ana = $this->member('Ana');
        $petar = $this->member('Petar');

        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-16', 'group_id' => $this->group('Small pool'), 'member_ids' => [$ana->id, $petar->id]]);
        $this->assertSame(2, Attendance::count());

        $this->actingAs($admin)
            ->post('/trainings', ['date' => '2026-11-16', 'group_id' => $this->group('Small pool'), 'member_ids' => []])
            ->assertSessionHasNoErrors();

        $this->assertSame(0, Attendance::count());
        $this->assertSame(0, Training::count());
        $this->actingAs($admin)
            ->getJson('/trainings/by-date?date=2026-11-16&group_id='.$this->group('Small pool'))
            ->assertExactJson(['member_ids' => []]);
    }

    public function test_saving_nobody_on_an_empty_day_creates_nothing()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post('/trainings', ['date' => '2026-11-17', 'group_id' => $this->group('Big pool'), 'member_ids' => []])
            ->assertSessionHasNoErrors();

        $this->assertSame(0, Training::count());
    }

    public function test_clearing_one_group_leaves_the_other_group_alone()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $ana = $this->member('Ana');

        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-16', 'group_id' => $this->group('Small pool'), 'member_ids' => [$ana->id]]);
        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-16', 'group_id' => $this->group('Big pool'), 'member_ids' => [$ana->id]]);

        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-16', 'group_id' => $this->group('Small pool'), 'member_ids' => []]);

        $this->assertSame(1, Training::count());
        $this->assertSame($this->group('Big pool'), Training::first()->group_id);
        $this->assertSame(1, Attendance::count());
    }

    public function test_member_ids_must_still_be_sent()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post('/trainings', ['date' => '2026-11-16', 'group_id' => $this->group('Small pool')])
            ->assertSessionHasErrors('member_ids');
    }
}
