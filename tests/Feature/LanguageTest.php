<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LanguageTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_app_is_in_macedonian_unless_english_was_chosen()
    {
        $this->get('/login')->assertOk()->assertSee('<html lang="mk"', false);

        $this->withUnencryptedCookie('locale', 'en')
            ->get('/login')
            ->assertSee('<html lang="en"', false);

        // Anything else falls back to Macedonian
        $this->withUnencryptedCookie('locale', 'de')
            ->get('/login')
            ->assertSee('<html lang="mk"', false);
    }

    public function test_form_errors_follow_the_language()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post('/groups', ['name' => ''])
            ->assertSessionHasErrors(['name' => 'Полето име е задолжително.']);

        $this->withUnencryptedCookie('locale', 'en')
            ->actingAs($admin)->post('/groups', ['name' => ''])
            ->assertSessionHasErrors(['name' => 'The name field is required.']);
    }

    public function test_notifications_are_worded_in_the_readers_language()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach', 'name' => 'Ana Coach']);

        $this->actingAs($coach)->post('/members', [
            'name' => 'Mia',
            'group_id' => $this->group('Big pool'),
            'parent_name' => 'Parent',
            'parent_phone' => '070111222',
        ])->assertSessionHasNoErrors();

        $this->actingAs($admin)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('notifications.unread.0.message', 'Ana Coach додаде нов член Mia'));

        $this->withUnencryptedCookie('locale', 'en')
            ->actingAs($admin)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
                ->where('notifications.unread.0.message', 'Ana Coach added a new member Mia'));
    }

    public function test_a_salary_notification_names_the_month_in_the_readers_language()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($admin)->post('/salaries', ['user_id' => $coach->id, 'amount' => 15000, 'month' => '2026-11-01'])
            ->assertSessionHasNoErrors();

        $this->actingAs($coach)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('notifications.unread.0.message', 'Плата за Ноември 2026: 15,000 MKD'));
    }
}
