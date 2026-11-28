<?php

namespace Tests\Feature;

use App\Mail\PaymentConfirmationMail;
use App\Mail\PaymentReminderMail;
use App\Models\Club;
use App\Models\ClubParent;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\PaymentReminder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Account settings (admins): whether the club sends payment confirmations and
 * unpaid-fee reminders, and whether they go out by themselves.
 */
class ClubEmailSwitchesTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    /** A member with a parent's email, late since October (one payment). */
    private function memberWithFee(string $name = 'Ana Petrova', string $email = 'goran@example.com'): array
    {
        $parent = ClubParent::create(['name' => 'Goran', 'phone' => '070111222', 'email' => $email]);
        $member = Member::create(['name' => $name, 'status' => 'active', 'parent_id' => $parent->id]);
        $fee = MembershipFee::create([
            'member_id' => $member->id, 'member_name' => $name, 'amount' => 1500, 'payment_method' => 'cash',
            'start_date' => '2026-10-01', 'end_date' => '2026-10-31',
        ]);

        return [$member, $fee];
    }

    public function test_sending_is_on_and_automatic_is_off_by_default_and_every_page_knows()
    {
        $this->actingAs($this->admin())->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('club.payment_confirmation_emails', true)
                ->where('club.payment_reminder_emails', true)
                ->where('club.auto_payment_confirmation', false)
                ->where('club.auto_payment_reminder', false));
    }

    public function test_an_admin_switches_one_at_a_time_coaches_cannot()
    {
        $admin = $this->admin();

        $this->actingAs($admin)->patch('/club/emails', ['payment_reminder_emails' => false])
            ->assertSessionHasNoErrors();
        $this->actingAs($admin)->patch('/club/emails', ['auto_payment_confirmation' => true]);

        $club = Club::current()->fresh();
        $this->assertFalse((bool) $club->payment_reminder_emails);
        $this->assertTrue((bool) $club->payment_confirmation_emails);
        $this->assertTrue((bool) $club->auto_payment_confirmation);

        $coach = User::factory()->create(['role' => 'coach']);
        $this->actingAs($coach)->patch('/club/emails', ['payment_reminder_emails' => true])->assertForbidden();
        $this->assertFalse((bool) $club->fresh()->payment_reminder_emails);
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

    public function test_an_automatic_confirmation_goes_out_as_the_payment_is_saved()
    {
        Mail::fake();
        Club::current()->update(['auto_payment_confirmation' => true]);
        [$member] = $this->memberWithFee();

        $this->actingAs($this->admin())->post('/membership-fees', [
            'member_id' => $member->id, 'amount' => 1500, 'payment_method' => 'cash',
            'start_date' => '2026-11-01', 'end_date' => '2026-11-30',
        ])->assertSessionHas('fee_saved', fn ($saved) => $saved['auto_sent'] === true);

        Mail::assertSent(PaymentConfirmationMail::class, fn ($mail) => $mail->hasTo('goran@example.com'));
        $this->assertNotNull(MembershipFee::latest('id')->first()->confirmation_sent_at);
    }

    public function test_no_automatic_confirmation_when_sending_is_off()
    {
        Mail::fake();
        Club::current()->update(['auto_payment_confirmation' => true, 'payment_confirmation_emails' => false]);
        [$member] = $this->memberWithFee();

        $this->actingAs($this->admin())->post('/membership-fees', [
            'member_id' => $member->id, 'amount' => 1500, 'payment_method' => 'cash',
            'start_date' => '2026-11-01', 'end_date' => '2026-11-30',
        ])->assertSessionHas('fee_saved', fn ($saved) => $saved['auto_sent'] === false);

        Mail::assertNothingSent();
    }

    public function test_automatic_reminders_go_once_per_family_and_only_once()
    {
        Mail::fake();
        [$ana] = $this->memberWithFee('Ana Petrova', 'goran@example.com');
        [$jana] = $this->memberWithFee('Jana Ilievska', 'ilija@example.com');
        // Paid for now: no reminder
        $this->memberWithFee('Paid Member', 'paid@example.com');
        MembershipFee::where('member_name', 'Paid Member')->update(['end_date' => now()->addMonth()->toDateString()]);

        // Off: nothing goes out
        Artisan::call('reminders:send');
        Mail::assertNothingSent();

        Club::current()->update(['auto_payment_reminder' => true]);
        Artisan::call('reminders:send');

        Mail::assertSent(PaymentReminderMail::class, 2);
        Mail::assertSent(PaymentReminderMail::class, fn ($mail) => $mail->hasTo('goran@example.com'));
        $this->assertSame(1, PaymentReminder::where('member_id', $ana->id)->count());
        $this->assertNull(PaymentReminder::where('member_id', $jana->id)->value('sent_by'));

        // The next day: they were already reminded, nothing again
        Artisan::call('reminders:send');
        Mail::assertSent(PaymentReminderMail::class, 2);
    }
}
