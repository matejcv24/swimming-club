<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_is_disabled()
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register', [
            'name' => 'Someone',
            'email' => 'someone@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertNotFound();

        $this->assertDatabaseMissing('users', ['email' => 'someone@example.com']);
    }

    public function test_admin_can_create_coach_who_can_log_in()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post('/staff', [
            'name' => 'New Coach',
            'email' => 'coach@example.com',
            'password' => 'secret-pass',
        ])->assertSessionHasNoErrors();

        $coach = User::where('email', 'coach@example.com')->firstOrFail();
        $this->assertSame('coach', $coach->role);

        auth()->logout();

        $this->post(route('login.store'), [
            'email' => 'coach@example.com',
            'password' => 'secret-pass',
        ])->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($coach);
    }

    public function test_coach_password_must_be_at_least_8_characters()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post('/staff', [
            'name' => 'New Coach',
            'email' => 'coach@example.com',
            'password' => 'short',
        ])->assertSessionHasErrors('password');
    }

    public function test_coach_cannot_create_staff()
    {
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($coach)->post('/staff', [
            'name' => 'Another Coach',
            'email' => 'another@example.com',
            'password' => 'secret-pass',
        ])->assertForbidden();
    }

    public function test_admin_can_update_coach_name_and_email_without_changing_password()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach', 'password' => 'old-password']);

        $this->actingAs($admin)->put("/staff/{$coach->id}", [
            'name' => 'Renamed Coach',
            'email' => 'renamed@example.com',
            'password' => '',
        ])->assertSessionHasNoErrors();

        $coach->refresh();
        $this->assertSame('Renamed Coach', $coach->name);
        $this->assertSame('renamed@example.com', $coach->email);
        $this->assertTrue(Hash::check('old-password', $coach->password));
    }

    public function test_admin_can_reset_coach_password_and_coach_is_logged_out_everywhere()
    {
        config(['session.driver' => 'database']);

        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach', 'password' => 'old-password']);
        $oldRememberToken = $coach->remember_token;

        DB::table('sessions')->insert([
            'id' => 'coach-session',
            'user_id' => $coach->id,
            'payload' => '',
            'last_activity' => time(),
        ]);

        $this->actingAs($admin)->put("/staff/{$coach->id}", [
            'name' => $coach->name,
            'email' => $coach->email,
            'password' => 'new-password',
        ])->assertSessionHasNoErrors();

        $coach->refresh();
        $this->assertTrue(Hash::check('new-password', $coach->password));
        $this->assertNotSame($oldRememberToken, $coach->remember_token);
        $this->assertDatabaseMissing('sessions', ['id' => 'coach-session']);

        auth()->logout();

        $this->post(route('login.store'), [
            'email' => $coach->email,
            'password' => 'new-password',
        ])->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_coach_email_must_be_unique_when_updating()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($admin)->put("/staff/{$coach->id}", [
            'name' => $coach->name,
            'email' => $admin->email,
        ])->assertSessionHasErrors('email');

        $this->actingAs($admin)->put("/staff/{$coach->id}", [
            'name' => $coach->name,
            'email' => $coach->email,
            'password' => 'short',
        ])->assertSessionHasErrors('password');
    }

    public function test_only_coaches_can_be_edited_and_only_by_admin()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $otherAdmin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($admin)->put("/staff/{$otherAdmin->id}", [
            'name' => 'Hacked',
            'email' => $otherAdmin->email,
        ])->assertNotFound();

        $this->actingAs($coach)->put("/staff/{$coach->id}", [
            'name' => 'Self Edit',
            'email' => $coach->email,
        ])->assertForbidden();
    }

    public function test_new_users_default_to_coach_role()
    {
        $user = User::factory()->create();

        $this->assertSame('coach', $user->fresh()->role);
    }
}
