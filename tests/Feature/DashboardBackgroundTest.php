<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardBackgroundTest extends TestCase
{
    use RefreshDatabase;

    public function test_popup_pages_get_the_dashboard_numbers_to_draw_behind_the_popup()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Invoice::create(['month' => now()->startOfYear()->toDateString(), 'pool' => 'big', 'amount' => 1200]);

        foreach (['/members', '/trainings', '/membership-fees', '/attendance', '/unpaid-fees', '/staff', '/invoices', '/profit'] as $url) {
            $this->actingAs($admin)
                ->get($url)
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('dashboardSummary.userRole', 'admin')
                    ->where('dashboardSummary.invoiceTotal', 1200)
                    ->where('dashboardSummary.profitTotal', -1200)
                    ->has('dashboardSummary.unpaidFees')
                    ->has('dashboardSummary.activeMembers'));
        }
    }

    public function test_coach_popup_pages_get_the_coach_cards()
    {
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($coach)
            ->get('/members')
            ->assertInertia(fn (Assert $page) => $page
                ->where('dashboardSummary.userRole', 'coach')
                ->where('dashboardSummary.coachSalaryTotal', 0));
    }

    public function test_other_pages_do_not_load_the_dashboard_numbers()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get('/notifications')
            ->assertInertia(fn (Assert $page) => $page->where('dashboardSummary', null));
    }

    public function test_dashboard_still_gets_its_numbers()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Invoice::create(['month' => now()->startOfYear()->toDateString(), 'pool' => 'big', 'amount' => 500]);

        $this->actingAs($admin)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('invoiceTotal', 500)
                ->where('profitTotal', -500)
                ->has('unpaidFees')
                ->has('activeMembers'));
    }
}
