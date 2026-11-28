<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\ClubParent;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Club settings: the club decides whether it sends payment confirmations and reminders. */
class ClubEmailSwitchesTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    /** A member with a parent's email, late since October (one payment). */
    private function memberWithFee(): array
    {
        $parent = ClubParent::create(['name' => 'Goran', 'phone' => '070111222', 'email' => 'goran@example.com']);
        $member = Member::create(['name' => 'Ana Petrova', 'status' => 'active', 'parent_id' => $parent->id]);
        $fee = MembershipFee::create([
            'member_id' => $member->id, 'member_name' => 'Ana Petrova', 'amount' => 1500, 'payment_method' => 'cash',
            'start_date' => '2026-10-01', 'end_date' => '2026-10-31',
        ]);

        return [$member, $fee];
    }

    public function test_both_emails_are_on_for_a_club_by_default_and_every_page_knows()
    {
        $this->actingAs($this->admin())->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('club.payment_confirmation_emails', true)
                ->where('club.payment_reminder_emails', true));
    }

    public function test_an_admin_switches_them_off_and_on()
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post('/club', [
            'name' => 'Club', 'email' => 'info@club.mk',
            'payment_confirmation_emails' => 0, 'payment_reminder_emails' => 0,
        ])->assertSessionHasNoErrors();

        $club = Club::current();
        $this->assertFalse((bool) $club->payment_confirmation_emails);
        $this->assertFalse((bool) $club->payment_reminder_emails);

        // Saving the name alone leaves them as they are
        $this->actingAs($admin)->post('/club', ['name' => 'Club', 'email' => 'info@club.mk']);
        $this->assertFalse((bool) $club->fresh()->payment_reminder_emails);

        $this->actingAs($admin)->post('/club', [
            'name' => 'Club', 'email' => 'info@club.mk', 'payment_reminder_emails' => 1,
        ]);
        $this->assertTrue((bool) $club->fresh()->payment_reminder_emails);
        $this->assertFalse((bool) $club->fresh()->payment_confirmation_emails);
    }

    public function test_nothing_is_sent_while_they_are_off()
    {
        Mail::fake();
        $admin = $this->admin();
        [$member, $fee] = $this->memberWithFee();
        Club::current()->update(['payment_confirmation_emails' => false, 'payment_reminder_emails' => false]);

        $this->actingAs($admin)->post("/membership-fees/{$fee->id}/confirmation")
            ->assertSessionHasErrors('confirmation');
        $this->actingAs($admin)->post("/unpaid-fees/{$member->id}/reminder")
            ->assertSessionHasErrors('reminder');

        Mail::assertNothingSent();
        $this->assertNull($fee->fresh()->confirmation_sent_at);
    }
}
