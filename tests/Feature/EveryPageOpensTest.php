<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\ClubParent;
use App\Models\Group;
use App\Models\Invoice;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\Salary;
use App\Models\Training;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Every page, pop-up and report opens without a server error, with the kinds of
 * data a club really has: members of one group, of a subgroup and of all
 * groups, payments, attendance, invoices, salaries and a deactivated coach.
 */
class EveryPageOpensTest extends TestCase
{
    use RefreshDatabase;

    private const PAGES = [
        '/dashboard', '/members', '/members?add=1', '/trainings', '/trainings?quick=1',
        '/membership-fees', '/membership-fees?add=1', '/attendance', '/unpaid-fees',
        '/notifications', '/settings/profile', '/settings/security', '/settings/appearance',
    ];

    private const ADMIN_PAGES = ['/staff', '/groups', '/invoices', '/profit'];

    private function clubWithData(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach', 'all_groups' => false]);
        $coach->coachGroups()->sync([$this->group('Small pool')]);
        User::factory()->create(['role' => 'coach'])->forceFill(['deactivated_at' => now()])->save();

        $small = $this->group('Small pool');
        $evening = Group::create(['name' => '18:00', 'parent_id' => $small])->id;
        $parent = ClubParent::create(['name' => 'Parent', 'phone' => '070000000', 'email' => 'parent@example.com']);

        $members = [
            Member::create(['name' => 'Ana', 'group_id' => $small, 'subgroup_id' => $evening, 'status' => 'active', 'parent_id' => $parent->id]),
            Member::create(['name' => 'Bojan', 'group_id' => null, 'status' => 'active', 'parent_id' => $parent->id]),
            Member::create(['name' => 'Ceca', 'group_id' => $this->group('Big pool'), 'status' => 'inactive', 'parent_id' => $parent->id]),
        ];

        foreach ($members as $member) {
            MembershipFee::create([
                'member_id' => $member->id, 'member_name' => $member->name, 'group_id' => $member->group_id,
                'amount' => 1500, 'payment_method' => 'cash', 'start_date' => '2026-09-01', 'end_date' => '2026-09-30',
            ]);
        }

        $training = Training::create(['coach_id' => $coach->id, 'date' => now()->toDateString(), 'group_id' => $small, 'subgroup_id' => $evening]);
        Attendance::create(['training_id' => $training->id, 'member_id' => $members[0]->id, 'present' => true]);
        Attendance::create(['training_id' => $training->id, 'member_id' => $members[1]->id, 'present' => true]);

        Invoice::create(['month' => now()->startOfMonth()->toDateString(), 'group_id' => null, 'amount' => 12000]);
        Salary::create(['user_id' => $coach->id, 'amount' => 15000, 'month' => now()->startOfMonth()->toDateString()]);

        return [$admin, $coach, $members];
    }

    public function test_every_page_opens_for_an_admin_and_a_coach()
    {
        [$admin, $coach, $members] = $this->clubWithData();
        $today = now()->toDateString();

        $data = [
            '/trainings/by-date?date='.$today.'&summary=1',
            '/trainings/by-date?date='.$today.'&group_id='.$this->group('Small pool'),
            '/trainings/days?month='.now()->format('Y-m'),
            '/attendance/by-member/'.$members[1]->id,
            '/membership-fees/by-member/'.$members[1]->id,
        ];

        foreach ([...self::PAGES, ...self::ADMIN_PAGES, ...$data, '/salaries/by-coach/'.$coach->id, '/invoices/by-month/'.now()->format('Y-m-d'), '/reports/monthly?month='.now()->format('Y-m')] as $url) {
            $status = $this->actingAs($admin)->get($url)->status();
            $this->assertLessThan(500, $status, "Admin: {$url} answered {$status}");
        }

        foreach ([...self::PAGES, ...$data] as $url) {
            $status = $this->actingAs($coach)->get($url)->status();
            $this->assertLessThan(500, $status, "Coach: {$url} answered {$status}");
        }
    }

    public function test_addresses_the_app_does_not_use_answer_not_found_instead_of_an_error()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        foreach (['/trainings/create', '/trainings/1', '/trainings/1/edit', '/members/create', '/members/1', '/membership-fees/1', '/membership-fees/create'] as $url) {
            $status = $this->actingAs($admin)->get($url)->status();
            $this->assertContains($status, [404, 405], "{$url} answered {$status}");
        }
    }
}
