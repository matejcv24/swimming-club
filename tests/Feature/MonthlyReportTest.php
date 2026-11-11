<?php

namespace Tests\Feature;

use App\Models\ClubParent;
use App\Models\Invoice;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\Salary;
use App\Models\User;
use App\Support\MonthlyReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MonthlyReportTest extends TestCase
{
    use RefreshDatabase;

    private function fee(string $name, string $pool, float $amount, string $method, string $start): MembershipFee
    {
        $parent = ClubParent::create(['name' => 'Parent of '.$name, 'phone' => '070000000']);
        $member = Member::create(['name' => $name, 'pool' => $pool, 'status' => 'active', 'parent_id' => $parent->id]);

        return MembershipFee::create([
            'member_id' => $member->id,
            'member_name' => $member->name,
            'pool' => $pool,
            'amount' => $amount,
            'payment_method' => $method,
            'start_date' => $start,
            'end_date' => date('Y-m-d', strtotime($start.' +1 month -1 day')),
        ]);
    }

    private function seedOctoberAndNeighbours(): void
    {
        // October 2026
        $this->fee('Petar', 'big', 2000, 'cash', '2026-10-01');
        $this->fee('Ana', 'big', 2000, 'card', '2026-10-31');
        $this->fee('Marija', 'small', 1500, 'cash', '2026-10-15');
        Invoice::create(['month' => '2026-10-01', 'pool' => 'small', 'amount' => 800]);
        Invoice::create(['month' => '2026-10-01', 'pool' => 'big', 'amount' => 1200]);
        $coach = User::factory()->create(['role' => 'coach', 'name' => 'Marko Stojanov']);
        Salary::create(['user_id' => $coach->id, 'amount' => 2500, 'month' => '2026-10-01']);

        // September and November must not be included
        $this->fee('Too early', 'big', 9999, 'cash', '2026-09-30');
        $this->fee('Too late', 'small', 9999, 'cash', '2026-11-01');
        Invoice::create(['month' => '2026-09-01', 'pool' => 'big', 'amount' => 9999]);
        Salary::create(['user_id' => $coach->id, 'amount' => 9999, 'month' => '2026-11-01']);
    }

    public function test_report_contains_only_the_chosen_month()
    {
        $this->seedOctoberAndNeighbours();

        $report = MonthlyReport::for(2026, 10);

        $this->assertSame(3, $report['feeCount']);
        $this->assertEquals(5500, $report['totals']['fees']);
        $this->assertEquals(2000, $report['totals']['invoices']);
        $this->assertEquals(2500, $report['totals']['salaries']);
        $this->assertEquals(1000, $report['totals']['profit']);
        $this->assertEquals(['cash' => 3500, 'card' => 2000], $report['feesByMethod']);
    }

    public function test_fees_are_split_by_pool_and_sorted_by_member()
    {
        $this->seedOctoberAndNeighbours();

        $report = MonthlyReport::for(2026, 10);

        $this->assertSame(['big', 'small'], $report['feesByPool']->pluck('pool')->all());
        $this->assertSame(['Ana', 'Petar'], $report['feesByPool'][0]['rows']->pluck('member')->all());
        $this->assertEquals(4000, $report['feesByPool'][0]['total']);
        $this->assertSame(['Marija'], $report['feesByPool'][1]['rows']->pluck('member')->all());
        $this->assertSame(['big', 'small'], $report['invoices']->pluck('pool')->all());
        $this->assertSame(['Marko Stojanov'], $report['salaries']->pluck('coach')->all());
    }

    public function test_admin_downloads_pdf()
    {
        $this->seedOctoberAndNeighbours();
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/reports/monthly?year=2026&month=10');

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringContainsString('SC-Hydra-Report-October-2026.pdf', $response->headers->get('content-disposition'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_empty_month_still_produces_a_pdf()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/reports/monthly?year=2020&month=1');

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_coach_cannot_download_report()
    {
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($coach)->get('/reports/monthly?year=2026&month=10')->assertForbidden();
    }

    public function test_guest_is_redirected_to_login()
    {
        $this->get('/reports/monthly?year=2026&month=10')->assertRedirect('/login');
    }

    public function test_dashboard_offers_reports_from_the_first_year_with_data()
    {
        $this->fee('Old member', 'big', 2000, 'cash', '2024-05-10');
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->where('reportFirstYear', 2024));
    }

    public function test_invalid_month_is_rejected()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get('/reports/monthly?year=2026&month=13')
            ->assertSessionHasErrors('month');
    }
}
