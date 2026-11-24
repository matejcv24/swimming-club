<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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

    public function test_an_invited_coach_sets_a_password_and_can_log_in()
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post('/staff/invitations', [
            'name' => 'New Coach',
            'email' => 'coach@example.com',
            'role' => 'coach',
            'all_groups' => true,
        ])->assertSessionHasNoErrors();

        auth()->logout();
        $token = Invitation::firstOrFail()->token;

        $this->post("/invitation/{$token}", [
            'password' => 'secret-pass',
            'password_confirmation' => 'secret-pass',
        ])->assertRedirect('/dashboard');

        $coach = User::where('email', 'coach@example.com')->firstOrFail();
        $this->assertSame('coach', $coach->role);
        $this->assertAuthenticatedAs($coach);

        auth()->logout();

        $this->post(route('login.store'), [
            'email' => 'coach@example.com',
            'password' => 'secret-pass',
        ])->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_an_invited_persons_password_must_be_at_least_8_characters()
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post('/staff/invitations', ['name' => 'Coach', 'email' => 'coach@example.com', 'role' => 'admin']);
        auth()->logout();

        $this->post('/invitation/'.Invitation::firstOrFail()->token, [
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertSessionHasErrors('password');

        $this->assertDatabaseMissing('users', ['email' => 'coach@example.com']);
    }

    public function test_coach_cannot_invite_staff()
    {
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($coach)->post('/staff/invitations', [
            'name' => 'Another Coach',
            'email' => 'another@example.com',
            'role' => 'coach',
            'all_groups' => true,
        ])->assertForbidden();

        $this->assertSame(0, Invitation::count());
    }

    public function test_admin_can_update_coach_name_and_email_without_changing_password()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach', 'password' => 'old-password']);

        $this->actingAs($admin)->put("/staff/{$coach->id}", [
            'name' => 'Renamed Coach',
            'email' => 'renamed@example.com',
            'password' => '',
            'all_groups' => true,
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
            'all_groups' => true,
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

    public function test_admins_and_coaches_can_be_edited_only_by_admins()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $otherAdmin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($admin)->put("/staff/{$otherAdmin->id}", [
            'name' => 'Renamed Admin',
            'email' => $otherAdmin->email,
        ])->assertSessionHasNoErrors();
        $this->assertSame('Renamed Admin', $otherAdmin->fresh()->name);

        $this->actingAs($coach)->put("/staff/{$coach->id}", [
            'name' => 'Self Edit',
            'email' => $coach->email,
        ])->assertForbidden();
    }

    public function test_an_invitation_needs_a_role_and_admins_need_no_groups()
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $data = ['name' => 'Ana', 'email' => 'ana@example.com'];

        $this->actingAs($admin)->post('/staff/invitations', $data)->assertSessionHasErrors('role');
        $this->actingAs($admin)->post('/staff/invitations', [...$data, 'role' => 'owner'])->assertSessionHasErrors('role');

        // A coach still needs groups; an admin doesn't
        $this->actingAs($admin)->post('/staff/invitations', [...$data, 'role' => 'coach'])->assertSessionHasErrors('all_groups');
        $this->actingAs($admin)->post('/staff/invitations', [...$data, 'role' => 'admin'])->assertSessionHasNoErrors();

        auth()->logout();
        $this->post('/invitation/'.Invitation::firstOrFail()->token, [
            'password' => 'secret-pass',
            'password_confirmation' => 'secret-pass',
        ]);

        $ana = User::where('email', 'ana@example.com')->firstOrFail();
        $this->assertSame('admin', $ana->role);
        $this->assertNull($ana->visibleGroupIds());
    }

    public function test_a_deactivated_account_cannot_log_in_until_activated_again()
    {
        config(['session.driver' => 'database']);
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach', 'password' => 'secret-pass']);
        DB::table('sessions')->insert(['id' => 'coach-session', 'user_id' => $coach->id, 'payload' => '', 'last_activity' => time()]);

        $this->actingAs($admin)->put("/staff/{$coach->id}/active", ['active' => false])->assertSessionHasNoErrors();
        $this->assertNotNull($coach->fresh()->deactivated_at);
        $this->assertDatabaseMissing('sessions', ['id' => 'coach-session']);

        auth()->logout();
        $this->post(route('login.store'), ['email' => $coach->email, 'password' => 'secret-pass'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();

        $this->actingAs($admin)->put("/staff/{$coach->id}/active", ['active' => true])->assertSessionHasNoErrors();
        auth()->logout();
        $this->post(route('login.store'), ['email' => $coach->email, 'password' => 'secret-pass'])
            ->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_someone_deactivated_while_logged_in_is_logged_out()
    {
        $coach = User::factory()->create(['role' => 'coach']);
        $coach->forceFill(['deactivated_at' => now()])->save();

        $this->actingAs($coach)->get('/dashboard')->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_nobody_can_deactivate_themselves_and_coaches_cannot_deactivate_anyone()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($admin)->put("/staff/{$admin->id}/active", ['active' => false])->assertForbidden();
        $this->actingAs($coach)->put("/staff/{$admin->id}/active", ['active' => false])->assertForbidden();
        $this->assertNull($admin->fresh()->deactivated_at);
    }

    public function test_new_users_default_to_coach_role()
    {
        $user = User::factory()->create();

        $this->assertSame('coach', $user->fresh()->role);
    }
}
