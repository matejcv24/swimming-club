<?php

namespace Tests\Feature;

use App\Http\Controllers\FamilyController;
use App\Mail\PaymentConfirmationMail;
use App\Models\Club;
use App\Models\ClubParent;
use App\Models\Group;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** "Payment received": offered after saving a payment, sent only when asked. */
class PaymentConfirmationTest extends TestCase
{
    use RefreshDatabase;

    private function member(?string $parentEmail = 'goran@example.com', ?int $groupId = null): Member
    {
        $parent = ClubParent::create(['name' => 'Goran', 'phone' => '070111222', 'email' => $parentEmail]);

        return Member::create(['name' => 'Ana Petrova', 'status' => 'active', 'parent_id' => $parent->id, 'group_id' => $groupId]);
    }

    private function pay(User $user, Member $member)
    {
        return $this->actingAs($user)->post('/membership-fees', [
            'member_id' => $member->id, 'amount' => 1500, 'payment_method' => 'cash',
            'start_date' => '2026-11-01', 'end_date' => '2026-11-30',
        ]);
    }

    public function test_saving_a_payment_offers_a_confirmation_but_sends_nothing()
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $member = $this->member();

        $this->pay($admin, $member)->assertSessionHas('fee_saved', fn ($saved) => $saved['member'] === 'Ana Petrova'
            && $saved['email'] === 'goran@example.com' && $saved['email_of'] === 'parent'
            && $saved['start_date'] === '2026-11-01' && $saved['end_date'] === '2026-11-30');

        Mail::assertNothingSent();
    }

    public function test_the_confirmation_goes_to_the_parent_and_is_recorded()
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $member = $this->member();
        $this->pay($admin, $member);
        $fee = MembershipFee::first();

        $this->actingAs($admin)->post("/membership-fees/{$fee->id}/confirmation")->assertSessionHasNoErrors();

        Mail::assertSent(PaymentConfirmationMail::class, fn ($mail) => $mail->hasTo('goran@example.com') && $mail->fee->is($fee));
        $this->assertNotNull($fee->fresh()->confirmation_sent_at);
        $this->actingAs($admin)->getJson("/membership-fees/by-member/{$member->id}")
            ->assertJsonPath('fees.0.confirmation_sent_at', fn ($value) => $value !== null);
    }

    public function test_the_email_says_thanks_with_the_period_and_the_family_link()
    {
        app()->setLocale('mk');
        $member = $this->member();
        $fee = MembershipFee::create([
            'member_id' => $member->id, 'member_name' => $member->name, 'amount' => 1500, 'payment_method' => 'cash',
            'start_date' => '2026-11-01', 'end_date' => '2026-11-30',
        ]);

        $html = (new PaymentConfirmationMail($fee, Club::current()))->render();

        $this->assertStringContainsString('Почитувани,', $html);
        $this->assertStringNotContainsString('Goran', $html);
        $this->assertStringContainsString('Ви благодариме за уплатата на членарината за <strong>Ana Petrova</strong>.', $html);
        $this->assertStringContainsString('Оваа уплата го покрива периодот од 01.11.2026 до 30.11.2026.', $html);
        $this->assertStringContainsString('/family?', $html);
    }

    public function test_the_link_opens_the_same_family_page_showing_paid_until()
    {
        $member = $this->member();
        MembershipFee::create([
            'member_id' => $member->id, 'member_name' => $member->name, 'amount' => 1500, 'payment_method' => 'cash',
            'start_date' => now()->startOfMonth(), 'end_date' => now()->endOfMonth(),
        ]);

        $link = FamilyController::link([$member->id]);

        $this->get($link)->assertOk()->assertInertia(fn ($page) => $page
            ->component('public/family')
            ->where('members.0.late', false)
            ->where('members.0.paid_until', now()->endOfMonth()->toDateString()));
    }

    public function test_coaches_never_send_emails_the_admin_sends_for_their_payments()
    {
        Mail::fake();
        $mine = Group::create(['name' => 'Mine'])->id;
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach', 'all_groups' => false]);
        $coach->coachGroups()->sync([$mine]);
        $member = $this->member('a@example.com', $mine);

        // The coach records it: saved, and the admin is told (notification opens the history)
        $this->pay($coach, $member)->assertSessionHasNoErrors();
        $fee = MembershipFee::first();
        $this->assertSame("/membership-fees?member={$member->id}&history=1&confirm={$fee->id}", $admin->fresh()->notifications()->first()->data['url']);

        $this->actingAs($coach)->post("/membership-fees/{$fee->id}/confirmation")->assertForbidden();
        Mail::assertNothingSent();

        // One tap by the admin sends it
        $this->actingAs($admin)->post("/membership-fees/{$fee->id}/confirmation")->assertSessionHasNoErrors();
        Mail::assertSent(PaymentConfirmationMail::class, fn ($mail) => $mail->hasTo('a@example.com'));
        $this->assertNotNull($fee->fresh()->confirmation_sent_at);
    }

    public function test_the_admin_sees_the_email_before_sending_coaches_cannot()
    {
        app()->setLocale('mk');
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);
        $member = $this->member();
        $this->pay($admin, $member);
        $fee = MembershipFee::first();

        $this->actingAs($admin)->getJson("/membership-fees/{$fee->id}/confirmation")
            ->assertOk()
            ->assertJson([
                'email' => 'goran@example.com',
                'source' => 'parent',
                'greeting' => 'Почитувани,',
                'period' => 'Оваа уплата го покрива периодот од 01.11.2026 до 30.11.2026.',
                'already_sent' => null,
            ]);

        $this->actingAs($coach)->getJson("/membership-fees/{$fee->id}/confirmation")->assertForbidden();
    }

    public function test_without_an_email_the_preview_asks_for_one_then_shows_the_email()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = $this->member(null);
        $this->pay($admin, $member);
        $fee = MembershipFee::first();

        $this->actingAs($admin)->getJson("/membership-fees/{$fee->id}/confirmation")
            ->assertStatus(422)
            ->assertJson(['no_email' => true, 'member_id' => $member->id, 'member' => 'Ana Petrova']);

        // Entered in the two fields (here the member's own), then the email is ready
        $this->actingAs($admin)->post("/unpaid-fees/{$member->id}/email", ['member_email' => 'ana@example.com', 'parent_email' => ''])
            ->assertSessionHasNoErrors();
        $this->actingAs($admin)->getJson("/membership-fees/{$fee->id}/confirmation")
            ->assertOk()->assertJson(['email' => 'ana@example.com', 'source' => 'member']);
    }

    public function test_an_admin_deletes_a_payment_entered_by_mistake_coaches_cannot()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);
        $member = $this->member();
        $this->pay($admin, $member);
        $fee = MembershipFee::first();

        $this->actingAs($coach)->delete("/membership-fees/{$fee->id}")->assertForbidden();
        $this->assertModelExists($fee);

        $this->actingAs($admin)->delete("/membership-fees/{$fee->id}")->assertSessionHasNoErrors();
        $this->assertModelMissing($fee);
        $this->assertSame(0.0, (float) MembershipFee::sum('amount'));
    }

    public function test_without_an_email_nothing_is_sent()
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $member = $this->member(null);
        $this->pay($admin, $member)->assertSessionHas('fee_saved', fn ($saved) => $saved['email'] === null);

        $this->actingAs($admin)->post('/membership-fees/'.MembershipFee::first()->id.'/confirmation')
            ->assertSessionHasErrors('confirmation');
        Mail::assertNothingSent();
    }
}
