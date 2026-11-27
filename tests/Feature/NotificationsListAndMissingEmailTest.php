<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\ClubNotification;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\User;
use App\Support\CurrentClub;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/** One notification list with deleting; the bell marks what it showed as read; a missing email entered from the unpaid list. */
class NotificationsListAndMissingEmailTest extends TestCase
{
    use RefreshDatabase;

    private function notify(User $user, string $message = 'Hi'): ClubNotification
    {
        return ClubNotification::create([
            'id' => (string) Str::uuid(), 'type' => 'test', 'notifiable_type' => User::class,
            'notifiable_id' => $user->id, 'data' => ['message' => $message, 'type' => 'member_changed', 'url' => '/members'],
        ]);
    }

    public function test_the_list_shows_read_and_unread_together()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->notify($admin, 'First');
        $this->notify($admin, 'Second')->markAsRead();

        $this->actingAs($admin)->get('/notifications')->assertInertia(fn ($page) => $page->has('items', 2)->missing('allNotifications'));
    }

    public function test_someone_deletes_their_own_notifications_but_not_others()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);
        $mine = $this->notify($admin);
        $this->notify($admin);
        $theirs = $this->notify($coach);

        $this->actingAs($admin)->delete("/notifications/{$theirs->id}")->assertNotFound();
        $this->actingAs($admin)->delete("/notifications/{$mine->id}")->assertRedirect();
        $this->assertSame(1, $admin->notifications()->count());

        $this->actingAs($admin)->delete('/notifications')->assertRedirect();
        $this->assertSame(0, $admin->notifications()->count());
        $this->assertSame(1, $coach->notifications()->count());
    }

    public function test_closing_the_bell_marks_only_the_shown_own_notifications_read()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);
        $shown = $this->notify($admin);
        $notShown = $this->notify($admin);
        $theirs = $this->notify($coach);

        $this->actingAs($admin)->post('/notifications/seen', ['ids' => [$shown->id, $theirs->id]])->assertRedirect();

        $this->assertNotNull($shown->fresh()->read_at);
        $this->assertNull($notShown->fresh()->read_at);
        $this->assertNull($theirs->fresh()->read_at);
    }

    public function test_notifications_of_the_other_club_are_untouched()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $other = Club::create(['name' => 'Other', 'slug' => 'other']);
        $otherNotice = CurrentClub::runFor($other, function () use ($admin) {
            $admin->forceFill(['role' => 'coach'])->save();

            return $this->notify($admin);
        });
        $this->notify($admin);

        $this->actingAs($admin)->delete('/notifications');

        $this->assertNotNull(ClubNotification::withoutGlobalScope('club')->find($otherNotice->id));
    }

    private function lateMember(array $details = []): Member
    {
        $member = Member::create(['name' => 'Late Swimmer', 'status' => 'active', ...$details]);
        MembershipFee::create([
            'member_id' => $member->id, 'member_name' => $member->name, 'amount' => 1500, 'payment_method' => 'cash',
            'start_date' => now()->subMonths(3)->startOfMonth(), 'end_date' => now()->subMonths(3)->endOfMonth(),
        ]);

        return $member;
    }

    public function test_a_missing_parent_email_is_saved_and_the_member_can_be_reminded()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = $this->lateMember();

        $this->actingAs($admin)->post("/unpaid-fees/{$member->id}/email", ['member_email' => '', 'parent_email' => 'Parent@Example.com'])
            ->assertSessionHasNoErrors();

        $this->assertSame('parent@example.com', $member->fresh()->parent->email);
        $this->actingAs($admin)->getJson("/unpaid-fees/{$member->id}/reminder")->assertOk()->assertJsonPath('email', 'parent@example.com');
    }

    public function test_the_members_own_email_can_be_saved_instead()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = $this->lateMember();

        $this->actingAs($admin)->post("/unpaid-fees/{$member->id}/email", ['member_email' => 'adult@example.com', 'parent_email' => ''])
            ->assertSessionHasNoErrors();

        $this->assertSame('adult@example.com', $member->fresh()->email);
        $this->assertNull($member->fresh()->parent_id);
    }

    public function test_both_emails_can_be_saved_at_once()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = $this->lateMember();

        $this->actingAs($admin)->post("/unpaid-fees/{$member->id}/email", ['member_email' => 'kid@example.com', 'parent_email' => 'mum@example.com'])
            ->assertSessionHasNoErrors();

        $this->assertSame('kid@example.com', $member->fresh()->email);
        $this->assertSame('mum@example.com', $member->fresh()->parent->email);
    }

    public function test_the_email_must_be_valid_and_coaches_cannot_save_it()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);
        $member = $this->lateMember();

        $this->actingAs($admin)->post("/unpaid-fees/{$member->id}/email", ['member_email' => 'nope'])->assertSessionHasErrors('member_email');
        $this->actingAs($admin)->post("/unpaid-fees/{$member->id}/email", ['member_email' => '', 'parent_email' => ''])
            ->assertSessionHasErrors(['member_email', 'parent_email']);
        $this->actingAs($coach)->post("/unpaid-fees/{$member->id}/email", ['parent_email' => 'a@b.mk'])->assertForbidden();
    }
}
