<?php

namespace Tests\Feature;

use App\Models\ClubParent;
use App\Models\Member;
use App\Models\User;
use App\Notifications\MemberChangedNotification;
use App\Notifications\MembershipPaymentNotification;
use App\Notifications\SalaryAddedNotification;
use App\Notifications\TrainingAttendanceNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\ChannelManager;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $coach;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->coach = User::factory()->create(['role' => 'coach']);
    }

    private function createMember(array $attributes = []): Member
    {
        $parent = ClubParent::create([
            'name' => 'Parent',
            'email' => null,
            'phone' => '070000000',
        ]);

        return Member::create([
            'name' => 'Swimmer',
            'pool' => 'small',
            'status' => 'active',
            'parent_id' => $parent->id,
            ...$attributes,
        ]);
    }

    public function test_admin_is_notified_when_coach_saves_training_attendance()
    {
        $member = $this->createMember();

        $this->actingAs($this->coach)->post('/trainings', [
            'date' => '2026-10-20',
            'pool' => 'small',
            'member_ids' => [$member->id],
        ])->assertSessionHasNoErrors();

        Notification::assertSentTo($this->admin, TrainingAttendanceNotification::class);
        Notification::assertNotSentTo($this->coach, TrainingAttendanceNotification::class);
    }

    public function test_admin_is_notified_when_coach_records_membership_fee()
    {
        $member = $this->createMember();

        $this->actingAs($this->coach)->post('/membership-fees', [
            'member_id' => $member->id,
            'amount' => 1500,
            'payment_method' => 'cash',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-31',
        ])->assertSessionHasNoErrors();

        Notification::assertSentTo($this->admin, MembershipPaymentNotification::class);
    }

    public function test_admin_is_notified_when_coach_adds_member()
    {
        $this->actingAs($this->coach)->post('/members', [
            'name' => 'New Swimmer',
            'pool' => 'big',
            'parent_name' => 'Parent',
            'parent_phone' => '070000000',
        ])->assertSessionHasNoErrors();

        Notification::assertSentTo($this->admin, MemberChangedNotification::class);
    }

    public function test_admin_is_notified_when_coach_updates_member()
    {
        $member = $this->createMember();

        $this->actingAs($this->coach)->put("/members/{$member->id}", [
            'name' => 'Renamed Swimmer',
            'pool' => 'small',
            'status' => 'active',
            'parent_name' => 'Parent',
            'parent_phone' => '070000000',
        ])->assertSessionHasNoErrors();

        Notification::assertSentTo(
            $this->admin,
            MemberChangedNotification::class,
            fn ($n) => $n->message === "{$this->coach->name} updated name for Renamed Swimmer",
        );
    }

    public function test_admin_is_not_notified_when_coach_saves_member_without_changes()
    {
        $member = $this->createMember();

        $this->actingAs($this->coach)->put("/members/{$member->id}", [
            'name' => 'Swimmer',
            'pool' => 'small',
            'status' => 'active',
            'parent_name' => 'Parent',
            'parent_phone' => '070000000',
        ])->assertSessionHasNoErrors();

        Notification::assertNotSentTo($this->admin, MemberChangedNotification::class);
    }

    public function test_admin_actions_do_not_notify_admins()
    {
        $member = $this->createMember();

        $this->actingAs($this->admin)->post('/trainings', [
            'date' => '2026-10-20',
            'pool' => 'small',
            'member_ids' => [$member->id],
        ]);

        $this->actingAs($this->admin)->post('/membership-fees', [
            'member_id' => $member->id,
            'amount' => 1500,
            'payment_method' => 'cash',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-31',
        ]);

        Notification::assertNothingSent();
    }

    public function test_coach_is_notified_when_admin_adds_salary()
    {
        $this->actingAs($this->admin)->post('/salaries', [
            'user_id' => $this->coach->id,
            'amount' => 30000,
            'month' => '2026-10-01',
        ])->assertSessionHasNoErrors();

        Notification::assertSentTo(
            $this->coach,
            SalaryAddedNotification::class,
            fn ($n) => $n->message === 'October 2026 salary: 30,000 MKD',
        );
        Notification::assertNotSentTo($this->admin, SalaryAddedNotification::class);
    }

    public function test_opening_one_notification_leaves_the_others_unread()
    {
        Notification::swap(new ChannelManager($this->app));

        $member = $this->createMember();

        foreach (['2026-10-20', '2026-10-21', '2026-10-22'] as $date) {
            $this->actingAs($this->coach)->post('/trainings', [
                'date' => $date,
                'pool' => 'small',
                'member_ids' => [$member->id],
            ]);
        }

        $notifications = $this->admin->fresh()->unreadNotifications;
        $this->assertCount(3, $notifications);

        $opened = $notifications->first();

        $this->actingAs($this->admin)
            ->post("/notifications/{$opened->id}/read")
            ->assertRedirect($opened->data['url']);

        $this->assertNotNull($opened->fresh()->read_at);
        $this->assertSame(2, $this->admin->fresh()->unreadNotifications()->count());
    }

    public function test_admin_cannot_mark_another_users_notification_as_read()
    {
        Notification::swap(new ChannelManager($this->app));

        $this->actingAs($this->admin)->post('/salaries', [
            'user_id' => $this->coach->id,
            'amount' => 30000,
            'month' => '2026-10-01',
        ]);

        $coachNotification = $this->coach->fresh()->unreadNotifications->first();

        $this->actingAs($this->admin)
            ->post("/notifications/{$coachNotification->id}/read")
            ->assertForbidden();

        $this->assertNull($coachNotification->fresh()->read_at);
    }

    public function test_notification_appears_in_admin_notification_list()
    {
        Notification::swap(new ChannelManager($this->app));

        $member = $this->createMember();

        $this->actingAs($this->coach)->post('/trainings', [
            'date' => '2026-10-20',
            'pool' => 'small',
            'member_ids' => [$member->id],
        ]);

        $this->assertSame(1, $this->admin->fresh()->unreadNotifications()->count());

        $this->actingAs($this->admin)->get('/notifications')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('unreadNotifications', 1)
                ->where('unreadNotifications.0.type', 'training_attendance'));
    }
}
