<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppearanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_users_default_to_dark()
    {
        $user = User::factory()->create();

        $this->assertSame('dark', $user->fresh()->appearance);
    }

    public function test_user_can_save_their_choice()
    {
        $user = User::factory()->create(['role' => 'coach']);

        $this->actingAs($user)
            ->patchJson('/settings/appearance', ['appearance' => 'light'])
            ->assertNoContent();

        $this->assertSame('light', $user->fresh()->appearance);
    }

    public function test_invalid_choice_is_rejected()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patchJson('/settings/appearance', ['appearance' => 'purple'])
            ->assertUnprocessable();

        $this->assertSame('dark', $user->fresh()->appearance);
    }

    public function test_guest_cannot_save_a_choice()
    {
        $this->patchJson('/settings/appearance', ['appearance' => 'light'])->assertUnauthorized();
    }

    public function test_page_opens_in_the_users_saved_theme()
    {
        $user = User::factory()->create(['role' => 'admin', 'appearance' => 'light']);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertSee('data-appearance="light"', false)
            ->assertDontSee('class="dark"', false);
    }

    public function test_saved_choice_beats_this_browsers_cookie()
    {
        $user = User::factory()->create(['role' => 'admin', 'appearance' => 'dark']);

        $this->actingAs($user)
            ->withUnencryptedCookie('appearance', 'light')
            ->get('/dashboard')
            ->assertSee('data-appearance="dark"', false);
    }

    public function test_guests_default_to_dark()
    {
        $this->get('/login')->assertSee('data-appearance="dark"', false);
    }
}
