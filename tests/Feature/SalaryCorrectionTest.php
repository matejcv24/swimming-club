<?php

namespace Tests\Feature;

use App\Models\Salary;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SalaryCorrectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_corrects_the_amount_and_month_of_a_salary()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);
        $salary = Salary::create(['user_id' => $coach->id, 'amount' => 15000, 'month' => '2026-09-01']);

        $this->actingAs($admin)->put("/salaries/{$salary->id}", ['amount' => 16000, 'month' => '2026-10-15'])
            ->assertSessionHasNoErrors();

        $salary->refresh();
        $this->assertEquals(16000, $salary->amount);
        $this->assertSame('2026-10-01', $salary->month->toDateString());

        $this->actingAs($admin)->put("/salaries/{$salary->id}", ['amount' => '', 'month' => 'not a date'])
            ->assertSessionHasErrors(['amount', 'month']);
    }

    public function test_an_admin_deletes_a_salary_entered_by_mistake()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $salary = Salary::create(['user_id' => $admin->id, 'amount' => 100, 'month' => '2026-09-01']);

        $this->actingAs($admin)->delete("/salaries/{$salary->id}")->assertSessionHasNoErrors();

        $this->assertModelMissing($salary);
    }

    public function test_coaches_cannot_change_or_delete_salaries()
    {
        $coach = User::factory()->create(['role' => 'coach']);
        $salary = Salary::create(['user_id' => $coach->id, 'amount' => 100, 'month' => '2026-09-01']);

        $this->actingAs($coach)->put("/salaries/{$salary->id}", ['amount' => 999999, 'month' => '2026-09-01'])->assertForbidden();
        $this->actingAs($coach)->delete("/salaries/{$salary->id}")->assertForbidden();

        $this->assertEquals(100, $salary->fresh()->amount);
    }

    public function test_the_staff_list_knows_every_month_each_person_has_a_salary_for()
    {
        $admin = User::factory()->create(['role' => 'admin', 'name' => 'Admin']);
        Salary::create(['user_id' => $admin->id, 'amount' => 100, 'month' => '2026-09-01']);
        Salary::create(['user_id' => $admin->id, 'amount' => 50, 'month' => '2026-09-01']);
        Salary::create(['user_id' => $admin->id, 'amount' => 100, 'month' => now()->startOfMonth()->toDateString()]);

        $this->actingAs($admin)->get('/staff')->assertInertia(fn (Assert $page) => $page
            ->where('staff.0.salary_this_month', true)
            ->where('staff.0.salary_months', fn ($months) => collect($months)->sort()->values()->all() === collect(['2026-09', now()->format('Y-m')])->unique()->sort()->values()->all()));
    }
}
