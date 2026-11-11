<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomeRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_bare_address_goes_to_the_login_page()
    {
        $this->get('/')->assertRedirect('/login');

        $this->followingRedirects()->get('/')->assertOk()->assertSee('auth\/login', false);
    }

    public function test_logged_in_user_ends_up_on_the_dashboard()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get('/')
            ->assertRedirect('/login');

        $this->actingAs($admin)
            ->get('/login')
            ->assertRedirect('/dashboard');
    }
}
