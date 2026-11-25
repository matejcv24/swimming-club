<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\Invitation;
use App\Models\Salary;
use App\Models\Training;
use App\Models\User;
use App\Notifications\MembershipPaymentNotification;
use App\Notifications\SalaryAddedNotification;
use App\Support\MonthlyReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use LogicException;
use Tests\TestCase;

class StaffDeleteAndAccountSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function coachWithHistory(): User
    {
        $coach = User::factory()->create(['role' => 'coach', 'name' => 'Marko']);
        Salary::create(['user_id' => $coach->id, 'amount' => 15000, 'month' => '2026-10-01']);
        Training::create(['coach_id' => $coach->id, 'date' => '2026-10-05']);

        return $coach;
    }

    public function test_only_a_deactivated_person_can_be_deleted_and_their_data_stays()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = $this->coachWithHistory();

        // Still active: not yet
        $this->actingAs($admin)->delete("/staff/{$coach->id}")->assertStatus(422);
        $this->assertFalse($coach->fresh()->trashed());

        $coach->forceFill(['deactivated_at' => now()])->save();
        $this->actingAs($admin)->delete("/staff/{$coach->id}")->assertRedirect();

        // Hidden, but the row and everything linked to it are still there
        $this->assertSoftDeleted($coach);
        $this->assertSame(1, DB::table('users')->where('id', $coach->id)->count());
        $this->assertSame(1, Salary::where('user_id', $coach->id)->count());
        $this->assertSame(1, Training::where('coach_id', $coach->id)->count());
        $this->assertSame('Marko', Salary::first()->user->name);
        $this->assertSame('Marko', Training::first()->coach->name);

        // Gone from the team list
        $this->actingAs($admin)->get('/staff')->assertInertia(fn (Assert $page) => $page
            ->where('staff', fn ($staff) => collect($staff)->doesntContain('id', $coach->id)));
    }

    public function test_the_monthly_finances_still_count_a_deleted_coachs_salary()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = $this->coachWithHistory();
        $before = json_encode(MonthlyReport::for(2026, 10));

        $coach->forceFill(['deactivated_at' => now()])->save();
        $this->actingAs($admin)->delete("/staff/{$coach->id}");

        $this->assertSame($before, json_encode(MonthlyReport::for(2026, 10)));
    }

    public function test_coaches_the_owner_and_yourself_cannot_be_deleted_by_the_wrong_person()
    {
        $owner = User::factory()->create(['role' => 'admin', 'deactivated_at' => null]);
        Club::current()->forceFill(['owner_id' => $owner->id])->save();
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach', 'deactivated_at' => now()]);

        // A coach can't delete anyone
        $otherCoach = User::factory()->create(['role' => 'coach']);
        $this->actingAs($otherCoach)->delete("/staff/{$coach->id}")->assertForbidden();
        $this->assertFalse($coach->fresh()->trashed());
        $this->actingAs($admin)->delete("/staff/{$admin->id}")->assertForbidden();
        $owner->forceFill(['deactivated_at' => now()])->save();
        $this->actingAs($admin)->delete("/staff/{$owner->id}")->assertForbidden();
    }

    public function test_a_deleted_account_cannot_log_in_and_is_never_removed_from_the_database()
    {
        $coach = User::factory()->create(['role' => 'coach', 'email' => 'marko@example.com', 'deactivated_at' => now()]);
        $coach->delete();

        $this->post('/login', ['email' => 'marko@example.com', 'password' => 'password']);
        $this->assertGuest();

        $this->expectException(LogicException::class);
        $coach->forceDelete();
    }

    public function test_a_deleted_person_invited_again_gets_their_old_account_and_history_back()
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = $this->coachWithHistory();
        $coach->forceFill(['deactivated_at' => now()])->save();
        $coach->delete();

        $this->actingAs($admin)->post('/staff/invitations', [
            'name' => 'Marko', 'email' => $coach->email, 'role' => 'coach', 'all_groups' => true,
        ])->assertSessionHasNoErrors();
        $invitation = Invitation::latest('id')->firstOrFail();
        auth()->logout();

        $this->post("/invitation/{$invitation->token}", [
            'password' => 'new-secret', 'password_confirmation' => 'new-secret',
        ])->assertRedirect('/dashboard');

        $back = User::where('email', $coach->email)->firstOrFail();
        $this->assertSame($coach->id, $back->id);
        $this->assertTrue($back->isActive());
        $this->assertSame(1, $back->trainings()->count());
    }

    public function test_coaches_see_name_email_and_password_only_admins_also_notifications()
    {
        $coach = User::factory()->create(['role' => 'coach']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($coach)->get('/settings/profile')->assertInertia(fn (Assert $page) => $page
            ->component('settings/profile')
            ->where('notificationSettings', null));
        $this->actingAs($coach)->patch('/settings/notifications', [])->assertForbidden();

        $this->actingAs($admin)->get('/settings/profile')->assertInertia(fn (Assert $page) => $page
            ->where('notificationSettings.membership_payment', true)
            ->where('notificationSettings.staff_joined', true));
    }

    public function test_an_admin_who_turns_a_kind_off_gets_neither_the_bell_nor_a_push()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->patch('/settings/notifications', [
            'member_changed' => true,
            'training_attendance' => true,
            'membership_payment' => false,
            'staff_joined' => true,
        ])->assertSessionHasNoErrors();

        $admin->refresh();
        $payment = new MembershipPaymentNotification('Paid', '/members');
        $this->assertSame([], $payment->via($admin));

        $admin->notify($payment);
        $this->assertSame(0, $admin->notifications()->count());

        // A coach's own salary can't be turned off
        $coach = User::factory()->create(['role' => 'coach']);
        $this->assertNotEmpty((new SalaryAddedNotification('Salary', '/dashboard'))->via($coach));
    }
}
