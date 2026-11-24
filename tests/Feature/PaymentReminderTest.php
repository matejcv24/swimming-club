<?php

namespace Tests\Feature;

use App\Mail\PaymentReminderMail;
use App\Models\Club;
use App\Models\ClubParent;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\PaymentReminder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class PaymentReminderTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    /** A member whose last paid month ended on the given day (null: never paid). */
    private function lateMember(string $name, array $attributes = [], ?string $paidUntil = '2026-10-31'): Member
    {
        $member = Member::create(['name' => $name, 'status' => 'active', ...$attributes]);

        if ($paidUntil) {
            MembershipFee::create([
                'member_id' => $member->id, 'member_name' => $name, 'amount' => 1500, 'payment_method' => 'cash',
                'start_date' => date('Y-m-01', strtotime($paidUntil)), 'end_date' => $paidUntil,
            ]);
        }

        return $member;
    }

    public function test_brothers_and_sisters_get_one_email_sent_to_their_parent()
    {
        Mail::fake();
        Club::current()->update(['name' => 'SC Hydra', 'email' => 'club@example.com']);
        $parent = ClubParent::create(['name' => 'Ana Veleska', 'phone' => '070', 'email' => 'Ana@Example.com']);
        $marko = $this->lateMember('Marko Veleski', ['parent_id' => $parent->id], '2026-10-31');
        $jana = $this->lateMember('Jana Veleska', ['parent_id' => ClubParent::create(['name' => 'Ana', 'email' => 'ana@example.com '])->id], null);
        $admin = $this->admin();

        $preview = $this->actingAs($admin)->getJson("/unpaid-fees/{$marko->id}/reminder")->assertOk()->json();
        $this->assertSame('Ana@Example.com', $preview['email']);
        $this->assertSame('parent', $preview['source']);
        $this->assertCount(2, $preview['members']);
        $this->assertNull($preview['last_sent_at']);

        $this->actingAs($admin)->post("/unpaid-fees/{$marko->id}/reminder")->assertSessionHasNoErrors();

        Mail::assertSent(PaymentReminderMail::class, 1);
        Mail::assertSent(PaymentReminderMail::class, function (PaymentReminderMail $mail) {
            $html = $mail->render();

            return $mail->hasTo('Ana@Example.com')
                && $mail->hasFrom(config('mail.from.address'), 'SC Hydra')
                && $mail->hasReplyTo('club@example.com')
                && str_contains($html, 'Marko Veleski')
                && str_contains($html, 'Jana Veleska')
                && str_contains($html, '31.10.2026');
        });

        $this->assertSame(2, PaymentReminder::count());
        $this->assertEqualsCanonicalizing([$jana->id, $marko->id], PaymentReminder::pluck('member_id')->all());

        // The list now says when they were reminded, and the next preview warns
        $this->actingAs($admin)->get('/unpaid-fees')->assertInertia(fn (Assert $page) => $page
            ->where('unpaidMembers.0.last_reminder_at', fn ($value) => $value !== null)
            ->where('unpaidMembers.1.last_reminder_at', fn ($value) => $value !== null));
        $this->assertNotNull($this->actingAs($admin)->getJson("/unpaid-fees/{$jana->id}/reminder")->json('last_sent_at'));
    }

    public function test_a_member_without_parent_email_gets_it_at_their_own_address()
    {
        Mail::fake();
        $member = $this->lateMember('Elena Stojanova', ['email' => 'elena@example.com'], '2026-09-30');

        $preview = $this->actingAs($this->admin())->getJson("/unpaid-fees/{$member->id}/reminder")->json();

        $this->assertSame('member', $preview['source']);
        $this->assertSame('Elena Stojanova', $preview['recipient_name']);
        $this->assertStringContainsString('Elena Stojanova', $preview['text']);
        $this->assertStringContainsString('30.09.2026', implode(' ', array_filter($preview['paragraphs'], 'is_string')));
    }

    public function test_there_is_nothing_to_send_without_an_email_or_for_someone_who_paid()
    {
        Mail::fake();
        $admin = $this->admin();
        $noEmail = $this->lateMember('No Email');
        $paid = $this->lateMember('Paid Up', ['email' => 'paid@example.com'], now()->addMonth()->endOfMonth()->toDateString());

        $this->actingAs($admin)->getJson("/unpaid-fees/{$noEmail->id}/reminder")->assertUnprocessable();
        $this->actingAs($admin)->post("/unpaid-fees/{$noEmail->id}/reminder")->assertSessionHasErrors('reminder');
        $this->actingAs($admin)->post("/unpaid-fees/{$paid->id}/reminder")->assertNotFound();

        Mail::assertNothingSent();
        $this->assertSame(0, PaymentReminder::count());
    }

    public function test_coaches_cannot_send_reminders()
    {
        Mail::fake();
        $member = $this->lateMember('Ana', ['email' => 'ana@example.com']);
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($coach)->getJson("/unpaid-fees/{$member->id}/reminder")->assertForbidden();
        $this->actingAs($coach)->post("/unpaid-fees/{$member->id}/reminder")->assertForbidden();

        Mail::assertNothingSent();
    }

    public function test_when_the_email_fails_nothing_is_marked_as_sent()
    {
        Mail::shouldReceive('to')->andThrow(new RuntimeException('No mail server'));
        $member = $this->lateMember('Ana', ['email' => 'ana@example.com']);

        $this->actingAs($this->admin())->post("/unpaid-fees/{$member->id}/reminder")->assertSessionHasErrors('reminder');

        $this->assertSame(0, PaymentReminder::count());
    }

    public function test_the_admin_can_change_the_text_and_the_changed_text_is_sent()
    {
        Mail::fake();
        $member = $this->lateMember('Ana', ['email' => 'ana@example.com']);
        $admin = $this->admin();

        $original = $this->actingAs($admin)->getJson("/unpaid-fees/{$member->id}/reminder")->json('text');
        $this->assertStringContainsString('Ana', $original);

        $this->actingAs($admin)->post("/unpaid-fees/{$member->id}/reminder", [
            'text' => "Hello Ana,\n\nPlease pay at the club on Monday. <b>Thanks</b>",
            'subject' => 'November fee',
        ])->assertSessionHasNoErrors();

        Mail::assertSent(PaymentReminderMail::class, function (PaymentReminderMail $mail) {
            $html = $mail->render();

            return $mail->hasSubject('November fee')
                && str_contains($html, 'Please pay at the club on Monday.')
                && str_contains($html, '&lt;b&gt;Thanks&lt;/b&gt;')
                && ! str_contains($html, 'as soon as possible');
        });
    }

    public function test_the_email_links_to_a_page_with_the_members_attendance_and_payments()
    {
        Mail::fake();
        $parent = ClubParent::create(['name' => 'Ana', 'email' => 'ana@example.com']);
        $marko = $this->lateMember('Marko', ['parent_id' => $parent->id], '2026-10-31');
        $other = $this->lateMember('Someone Else', ['email' => 'else@example.com']);

        $this->actingAs($this->admin())->post("/unpaid-fees/{$marko->id}/reminder");

        $link = null;
        Mail::assertSent(PaymentReminderMail::class, function (PaymentReminderMail $mail) use (&$link) {
            preg_match('/href="([^"]*\/family\?[^"]*)"/', $mail->render(), $match);
            $link = html_entity_decode($match[1] ?? '');

            return $link !== '';
        });
        auth()->logout();

        // No login needed
        $this->get($link)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('public/family')
            ->has('members', 1)
            ->where('members.0.name', 'Marko')
            ->where('members.0.late', true)
            ->where('members.0.paid_until', '2026-10-31'));

        // Changing the link to show someone else doesn't work
        $this->get(str_replace("members={$marko->id}", "members={$other->id}", $link))->assertForbidden();
        $this->get('/family?members='.$marko->id)->assertForbidden();

        // Nor after it expires
        $this->travel(61)->days();
        $this->get($link)->assertForbidden();
    }

    public function test_the_clubs_logo_is_attached_to_the_email_when_there_is_one()
    {
        config(['mail.default' => 'array']);
        Storage::fake('local');
        Storage::disk('local')->put('clubs/1/logo.png', UploadedFile::fake()->image('logo.png', 64, 64)->getContent());
        Club::current()->forceFill(['logo_path' => 'clubs/1/logo.png'])->save();
        $member = $this->lateMember('Ana', ['email' => 'ana@example.com']);

        $this->actingAs($this->admin())->post("/unpaid-fees/{$member->id}/reminder")->assertSessionHasNoErrors();

        $sent = app('mailer')->getSymfonyTransport()->messages()->last()->getOriginalMessage();
        $this->assertNotEmpty($sent->getAttachments());
        $this->assertStringContainsString('cid:', $sent->getHtmlBody());
    }
}
