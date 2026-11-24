<?php

namespace Tests\Feature;

use App\Mail\StaffInvitationMail;
use App\Models\Club;
use App\Models\Group;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class StaffInvitationTest extends TestCase
{
    use RefreshDatabase;

    private function invite(User $admin, array $data = []): Invitation
    {
        $this->actingAs($admin)->post('/staff/invitations', [
            'name' => 'Marko', 'email' => 'marko@example.com', 'role' => 'coach', 'all_groups' => true, ...$data,
        ])->assertSessionHasNoErrors();

        return Invitation::latest('id')->firstOrFail();
    }

    public function test_an_invitation_is_emailed_in_the_clubs_name_with_replies_to_the_club()
    {
        Mail::fake();
        Club::current()->update(['name' => 'SC Hydra', 'email' => 'club@example.com']);
        $admin = User::factory()->create(['role' => 'admin', 'name' => 'Ana']);

        $invitation = $this->invite($admin);

        Mail::assertSent(StaffInvitationMail::class, function (StaffInvitationMail $mail) use ($invitation) {
            return $mail->hasTo('marko@example.com')
                && $mail->hasFrom(config('mail.from.address'), 'SC Hydra')
                && $mail->hasReplyTo('club@example.com')
                && str_contains($mail->render(), $invitation->link());
        });

        $this->assertNotNull($invitation->email_sent_at);
        $this->assertNull($invitation->email_failed_at);
        $this->assertTrue($invitation->expires_at->between(now()->addDays(6), now()->addDays(8)));
    }

    public function test_when_the_email_fails_the_invitation_stays_and_is_marked_so_the_link_can_be_copied()
    {
        Mail::shouldReceive('to')->andThrow(new RuntimeException('No mail server'));
        $admin = User::factory()->create(['role' => 'admin']);

        $invitation = $this->invite($admin);

        $this->assertNotNull($invitation->email_failed_at);
        $this->actingAs($admin)->get('/staff')->assertInertia(fn (Assert $page) => $page
            ->where('invitations.0.email_failed', true)
            ->where('invitations.0.link', $invitation->link()));
    }

    public function test_the_secret_is_stored_only_hashed_and_encrypted()
    {
        Mail::fake();
        $invitation = $this->invite(User::factory()->create(['role' => 'admin']));

        $raw = DB::table('invitations')->where('id', $invitation->id)->first();
        $this->assertNotSame($invitation->token, $raw->token);
        $this->assertSame(hash('sha256', $invitation->token), $raw->token_hash);
    }

    public function test_an_existing_account_cannot_be_invited_and_inviting_again_replaces_the_old_invitation()
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin', 'email' => 'admin@example.com']);

        $this->actingAs($admin)->post('/staff/invitations', [
            'name' => 'Me', 'email' => 'admin@example.com', 'role' => 'admin',
        ])->assertSessionHasErrors('email');

        $this->invite($admin);
        $second = $this->invite($admin, ['name' => 'Marko V.']);

        $this->assertSame(1, Invitation::count());
        $this->assertSame('Marko V.', $second->name);
    }

    public function test_the_invited_coach_gets_the_chosen_groups()
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $group = Group::create(['name' => 'Beginners'])->id;
        $invitation = $this->invite($admin, ['all_groups' => false, 'group_ids' => [$group]]);
        auth()->logout();

        $this->get("/invitation/{$invitation->token}")->assertInertia(fn (Assert $page) => $page
            ->component('auth/accept-invitation')
            ->where('invitation.email', 'marko@example.com'));

        $this->post("/invitation/{$invitation->token}", [
            'password' => 'secret-pass', 'password_confirmation' => 'secret-pass',
        ])->assertRedirect('/dashboard');

        $coach = User::where('email', 'marko@example.com')->firstOrFail();
        $this->assertSame([$group], $coach->visibleGroupIds());
        $this->assertNotNull($invitation->fresh()->accepted_at);
    }

    public function test_a_link_works_once_and_not_after_it_expires()
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $used = $this->invite($admin);
        $expired = $this->invite($admin, ['email' => 'late@example.com']);
        $expired->forceFill(['expires_at' => now()->subMinute()])->save();
        auth()->logout();

        $this->post("/invitation/{$used->token}", ['password' => 'secret-pass', 'password_confirmation' => 'secret-pass']);
        auth()->logout();

        foreach ([$used->token, $expired->token, 'made-up-token'] as $token) {
            $this->get("/invitation/{$token}")->assertInertia(fn (Assert $page) => $page->where('invitation', null));
            $this->post("/invitation/{$token}", ['password' => 'other-pass', 'password_confirmation' => 'other-pass']);
        }

        $this->assertDatabaseMissing('users', ['email' => 'late@example.com']);
        $this->assertSame(1, User::where('email', 'marko@example.com')->count());
    }

    public function test_sending_again_extends_the_same_link_and_cancelling_removes_it()
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = $this->invite($admin);
        $invitation->forceFill(['expires_at' => now()->subDay()])->save();

        $this->actingAs($admin)->post("/staff/invitations/{$invitation->id}/resend")->assertSessionHasNoErrors();
        $fresh = $invitation->fresh();
        $this->assertFalse($fresh->isExpired());
        $this->assertSame($invitation->token, $fresh->token);
        Mail::assertSent(StaffInvitationMail::class, 2);

        $this->actingAs($admin)->delete("/staff/invitations/{$invitation->id}");
        $this->assertSame(0, Invitation::count());
    }

    public function test_coaches_cannot_resend_or_cancel_invitations()
    {
        Mail::fake();
        $invitation = $this->invite(User::factory()->create(['role' => 'admin']));
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($coach)->post("/staff/invitations/{$invitation->id}/resend")->assertForbidden();
        $this->actingAs($coach)->delete("/staff/invitations/{$invitation->id}")->assertForbidden();
        $this->assertSame(1, Invitation::count());
    }

    public function test_the_owner_cannot_be_deactivated_or_changed_by_other_admins()
    {
        $owner = User::factory()->create(['role' => 'admin']);
        // Named to be listed after the owner
        $admin = User::factory()->create(['role' => 'admin', 'name' => 'Zoran Admin']);
        Club::current()->forceFill(['owner_id' => $owner->id])->save();

        $this->actingAs($admin)->put("/staff/{$owner->id}/active", ['active' => false])->assertForbidden();
        $this->actingAs($admin)->put("/staff/{$owner->id}", ['name' => 'Taken', 'email' => 'taken@example.com'])->assertForbidden();
        $this->assertNull($owner->fresh()->deactivated_at);

        // The owner changes their own details
        $this->actingAs($owner)->put("/staff/{$owner->id}", ['name' => 'Owner', 'email' => $owner->email])->assertSessionHasNoErrors();

        $this->actingAs($admin)->get('/staff')->assertInertia(fn (Assert $page) => $page
            ->where('staff.0.name', 'Owner')
            ->where('staff.0.is_owner', true));
    }
}
