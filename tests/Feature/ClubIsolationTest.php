<?php

namespace Tests\Feature;

use App\Http\Controllers\FamilyController;
use App\Models\Attendance;
use App\Models\Club;
use App\Models\ClubNotification;
use App\Models\ClubParent;
use App\Models\Group;
use App\Models\Invitation;
use App\Models\Invoice;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\Salary;
use App\Models\Training;
use App\Models\User;
use App\Support\CurrentClub;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use LogicException;
use Tests\TestCase;

/**
 * Clubs are kept apart completely: nobody in club A can see, change, attach or
 * even detect club B's data, through any page, pop-up, data request or form.
 */
class ClubIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Club $a;

    private Club $b;

    /** @var array<string, mixed> Club A's records */
    private array $inA;

    /** @var array<string, mixed> Club B's records */
    private array $inB;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        $this->a = Club::first();
        $this->b = Club::create(['name' => 'Club Bravo', 'slug' => 'bravo', 'email' => 'bravo@example.com']);

        $this->inA = CurrentClub::runFor($this->a, fn () => $this->fill('Alpha'));
        $this->inB = CurrentClub::runFor($this->b, fn () => $this->fill('Bravo'));
    }

    /** The same kinds of records in a club, every name starting with the prefix. */
    private function fill(string $prefix): array
    {
        $admin = User::factory()->create(['name' => "$prefix Admin", 'role' => 'admin']);
        $coach = User::factory()->create(['name' => "$prefix Coach", 'role' => 'coach']);
        $group = Group::create(['name' => "$prefix Group"]);
        $parent = ClubParent::create(['name' => "$prefix Parent", 'phone' => '070111222', 'email' => strtolower($prefix).'@parent.test']);
        $member = Member::create(['name' => "$prefix Swimmer", 'status' => 'active', 'group_id' => $group->id, 'parent_id' => $parent->id]);
        $training = Training::create(['coach_id' => $coach->id, 'date' => now()->toDateString(), 'group_id' => $group->id]);
        $attendance = Attendance::create(['training_id' => $training->id, 'member_id' => $member->id, 'present' => true]);
        $fee = MembershipFee::create([
            'member_id' => $member->id, 'member_name' => $member->name, 'group_id' => $group->id, 'amount' => 1500,
            'payment_method' => 'cash', 'start_date' => now()->subMonths(3)->startOfMonth(), 'end_date' => now()->subMonths(3)->endOfMonth(),
        ]);
        $invoice = Invoice::create(['month' => now()->startOfMonth(), 'group_id' => $group->id, 'amount' => 9000]);
        $salary = Salary::create(['user_id' => $coach->id, 'amount' => 20000, 'month' => now()->startOfMonth()]);
        $invitation = new Invitation(['name' => "$prefix Invitee", 'email' => strtolower($prefix).'@invite.test', 'role' => 'coach', 'all_groups' => true, 'invited_by' => $admin->id]);
        $invitation->renew();
        $invitation->save();
        $notification = ClubNotification::create([
            'id' => (string) Str::uuid(), 'type' => 'test', 'notifiable_type' => User::class, 'notifiable_id' => $admin->id,
            'data' => ['message' => "$prefix notice", 'type' => 'member_changed', 'url' => '/members'],
        ]);

        return compact('admin', 'coach', 'group', 'parent', 'member', 'training', 'attendance', 'fee', 'invoice', 'salary', 'invitation', 'notification');
    }

    public function test_every_page_shows_only_the_own_clubs_data()
    {
        $pages = ['/dashboard', '/members', '/groups', '/staff', '/trainings', '/membership-fees', '/unpaid-fees',
            '/attendance', '/invoices', '/profit', '/notifications', '/settings/profile'];

        foreach (['admin', 'coach'] as $role) {
            foreach ($pages as $page) {
                $response = $this->actingAs($this->inA[$role])->get($page);

                if ($response->status() === 403) {
                    continue;
                }

                $response->assertOk();
                $response->assertDontSee('Bravo');
            }
        }

        $this->actingAs($this->inA['admin'])->get('/members')->assertSee('Alpha Swimmer');
        $this->actingAs($this->inB['admin'])->get('/members')->assertSee('Bravo Swimmer')->assertDontSee('Alpha');
    }

    public function test_data_requests_for_another_clubs_records_are_not_found()
    {
        $b = $this->inB;
        $this->actingAs($this->inA['admin']);

        $this->getJson("/attendance/by-member/{$b['member']->id}")->assertNotFound();
        $this->getJson("/membership-fees/by-member/{$b['member']->id}")->assertNotFound();
        $this->getJson("/salaries/by-coach/{$b['coach']->id}")->assertNotFound();
        $this->getJson("/unpaid-fees/{$b['member']->id}/reminder")->assertNotFound();
        $this->get("/notifications/{$b['notification']->id}/open")->assertNotFound();

        $this->getJson('/invoices/by-month/'.now()->format('Y-m'))->assertOk()->assertDontSee('Bravo');
        $this->getJson('/trainings/by-date?date='.now()->toDateString().'&group_id='.$b['group']->id)->assertDontSee('Bravo');
        $this->get('/reports/monthly?month='.now()->format('Y-m'))->assertDontSee('Bravo');
    }

    public function test_another_clubs_records_cannot_be_changed_or_deleted()
    {
        $b = $this->inB;
        $this->actingAs($this->inA['admin']);

        $this->put("/members/{$b['member']->id}", ['name' => 'Hacked', 'status' => 'active'])->assertNotFound();
        $this->delete("/members/{$b['member']->id}")->assertNotFound();
        $this->put("/groups/{$b['group']->id}", ['name' => 'Hacked'])->assertNotFound();
        $this->delete("/groups/{$b['group']->id}")->assertNotFound();
        $this->put("/membership-fees/{$b['fee']->id}", ['amount' => 1, 'payment_method' => 'cash', 'start_date' => '2026-01-01', 'end_date' => '2026-01-31'])->assertNotFound();
        $this->put("/salaries/{$b['salary']->id}", ['amount' => 1])->assertNotFound();
        $this->delete("/salaries/{$b['salary']->id}")->assertNotFound();
        $this->put("/invoices/{$b['invoice']->id}", ['amount' => 1])->assertNotFound();
        $this->delete("/invoices/{$b['invoice']->id}")->assertNotFound();
        $this->put("/staff/{$b['coach']->id}", ['name' => 'Hacked', 'email' => 'x@x.test'])->assertNotFound();
        $this->put("/staff/{$b['coach']->id}/active", ['active' => false])->assertNotFound();
        $this->delete("/staff/{$b['coach']->id}")->assertNotFound();
        $this->post("/staff/invitations/{$b['invitation']->id}/resend")->assertNotFound();
        $this->delete("/staff/invitations/{$b['invitation']->id}")->assertNotFound();
        $this->post("/notifications/{$b['notification']->id}/read")->assertNotFound();
        $this->post("/unpaid-fees/{$b['member']->id}/reminder", ['text' => 'x', 'subject' => 'x'])->assertNotFound();

        CurrentClub::runFor($this->b, function () use ($b) {
            $this->assertSame('Bravo Swimmer', $b['member']->fresh()->name);
            $this->assertSame('Bravo Group', $b['group']->fresh()->name);
            $this->assertSame(1, Member::count());
            $this->assertSame(1, Salary::count());
            $this->assertSame(1, Invoice::count());
            $this->assertNull($b['coach']->fresh()->deactivated_at);
        });
    }

    public function test_another_clubs_ids_cannot_be_attached_in_forms()
    {
        $b = $this->inB;
        $this->actingAs($this->inA['admin']);

        $this->post('/members', ['name' => 'New', 'group_id' => $b['group']->id])->assertSessionHasErrors('group_id');
        $this->post('/trainings', ['date' => now()->toDateString(), 'group_id' => $this->inA['group']->id, 'member_ids' => [$b['member']->id]])
            ->assertSessionHasErrors('member_ids.0');
        $this->post('/membership-fees', ['member_id' => $b['member']->id, 'amount' => 1, 'payment_method' => 'cash', 'start_date' => '2026-01-01', 'end_date' => '2026-01-31'])
            ->assertSessionHasErrors('member_id');
        $this->post('/salaries', ['user_id' => $b['coach']->id, 'amount' => 1, 'month' => '2026-01-01'])->assertSessionHasErrors('user_id');
        $this->post('/invoices', ['group_id' => $b['group']->id, 'amount' => 1, 'month' => '2026-01'])->assertSessionHasErrors('group_id');
        $this->post('/staff/invitations', ['name' => 'X', 'email' => 'x@new.test', 'role' => 'coach', 'all_groups' => false, 'group_ids' => [$b['group']->id]])
            ->assertSessionHasErrors('group_ids.0');

        CurrentClub::runFor($this->b, fn () => $this->assertSame(1, Member::count()));
    }

    public function test_a_family_link_shows_only_its_own_clubs_members()
    {
        $link = CurrentClub::runFor($this->a, fn () => FamilyController::link([$this->inA['member']->id, $this->inB['member']->id]));

        $this->get($link)->assertOk()->assertSee('Alpha Swimmer')->assertDontSee('Bravo');

        $onlyB = CurrentClub::runFor($this->a, fn () => FamilyController::link([$this->inB['member']->id]));
        $this->get($onlyB)->assertNotFound();
    }

    public function test_with_no_club_nothing_is_read_and_nothing_is_written()
    {
        CurrentClub::runFor(null, function () {
            $this->assertThrows(fn () => Member::count(), LogicException::class);
            $this->assertThrows(fn () => Group::create(['name' => 'Nowhere']), LogicException::class);
        });
    }

    public function test_a_record_of_another_club_cannot_be_saved_or_deleted_by_code()
    {
        $memberB = $this->inB['member'];

        CurrentClub::runFor($this->a, function () use ($memberB) {
            $memberB->name = 'Changed';
            $this->assertThrows(fn () => $memberB->save(), LogicException::class);
            $this->assertThrows(fn () => $memberB->delete(), LogicException::class);
        });
    }

    public function test_one_person_works_in_two_clubs_with_a_role_in_each()
    {
        $person = $this->inA['admin'];
        CurrentClub::runFor($this->b, fn () => $person->forceFill(['role' => 'coach'])->save());

        // First club: admin there, only that club's data
        $this->actingAs($person)->get('/staff')->assertOk()->assertSee('Alpha Coach')->assertDontSee('Bravo Coach')->assertDontSee('Bravo Swimmer');

        // Switching to the other club: a coach there, only that club's data
        $this->withSession([CurrentClub::SESSION_KEY => $this->b->id])->actingAs($person);
        CurrentClub::forget();
        $this->get('/staff')->assertForbidden();
        // (Their own name, "Alpha Admin", is on every page of course)
        $this->get('/members')->assertOk()->assertSee('Bravo Swimmer')
            ->assertDontSee('Alpha Swimmer')->assertDontSee('Alpha Group')->assertDontSee('Alpha Parent');
    }

    public function test_removing_someone_from_one_club_keeps_them_in_the_other()
    {
        $person = $this->inA['coach'];
        CurrentClub::runFor($this->b, fn () => $person->forceFill(['role' => 'coach'])->save());

        $this->actingAs($this->inA['admin'])->put("/staff/{$person->id}/active", ['active' => false]);
        $this->actingAs($this->inA['admin'])->delete("/staff/{$person->id}")->assertSessionHasNoErrors();

        $this->assertNotSoftDeleted($person);
        $this->assertSame([$this->b->id], $person->memberships()->pluck('club_id')->all());
        // Their training and salary in club A stay
        CurrentClub::runFor($this->a, fn () => $this->assertSame(1, Salary::where('user_id', $person->id)->count()));
    }

    public function test_someone_of_another_club_joins_with_their_own_password()
    {
        $bravoAdmin = $this->inB['admin'];
        $invitation = CurrentClub::runFor($this->a, function () use ($bravoAdmin) {
            $invitation = new Invitation(['name' => 'Bravo Admin', 'email' => $bravoAdmin->email, 'role' => 'coach', 'all_groups' => true]);
            $invitation->renew();
            $invitation->save();

            return $invitation;
        });

        $this->get('/invitation/'.$invitation->token)->assertOk()
            ->assertInertia(fn ($page) => $page->where('invitation.existing_account', true)->where('invitation.club', $this->a->name));

        $this->post('/invitation/'.$invitation->token, ['password' => 'wrong-password'])->assertSessionHasErrors('password');
        $this->post('/invitation/'.$invitation->token, ['password' => 'password'])->assertRedirect('/dashboard');

        $this->assertEqualsCanonicalizing([$this->a->id, $this->b->id], $bravoAdmin->memberships()->pluck('club_id')->all());
        CurrentClub::runFor($this->a, fn () => $this->assertSame('coach', $bravoAdmin->fresh()->role));
        CurrentClub::runFor($this->b, fn () => $this->assertSame('admin', $bravoAdmin->fresh()->role));
    }

    /** A plain "exists" rule would accept another club's id: controllers use ClubRule. */
    public function test_no_controller_looks_up_records_with_a_plain_exists_rule()
    {
        foreach (glob(app_path('Http/Controllers/*.php')) as $file) {
            $this->assertDoesNotMatchRegularExpression('/(?<!Club)Rule::exists\(|[\'"]exists:/', file_get_contents($file), basename($file));
        }
    }

    /**
     * Every route of the app is listed here, either as tested above for club
     * isolation or as holding no club data. A new route fails this test until
     * someone decides which it is (and adds its isolation test).
     */
    public function test_every_route_is_covered_by_an_isolation_decision()
    {
        $clubData = [
            'dashboard', 'members', 'members/{member}', 'members/{member}/restore', 'parents', 'attendance', 'attendance/by-member/{member}',
            'trainings', 'trainings/by-date', 'trainings/days', 'membership-fees', 'membership-fees/by-member/{member}',
            'membership-fees/{membershipFee}', 'membership-fees/{membershipFee}/confirmation', 'unpaid-fees', 'unpaid-fees/{member}/reminder', 'groups', 'groups/{group}',
            'staff', 'staff/{coach}', 'staff/{coach}/active', 'staff/invitations', 'staff/invitations/{invitation}',
            'staff/invitations/{invitation}/resend', 'salaries', 'salaries/{salary}', 'salaries/by-coach/{coach}',
            'invoices', 'invoices/{invoice}', 'invoices/by-month/{month}', 'profit', 'reports/monthly',
            'notifications', 'notifications/{notification}/read', 'notifications/{notification}/open', 'notifications/seen', 'notifications/{notification}', 'unpaid-fees/{member}/email', 'family',
            'club', 'club/logo', 'invitation/{token}', 'clubs/{club}/switch',
        ];

        // The person's own account and device, signing in, and framework routes
        $noClubData = [
            '/', 'login', 'logout', 'forgot-password', 'reset-password', 'reset-password/{token}', 'email/verify',
            'email/verify/{id}/{hash}', 'email/verification-notification', 'two-factor-challenge', 'user/confirm-password',
            'user/confirmed-password-status', 'user/two-factor-authentication', 'user/confirmed-two-factor-authentication',
            'user/two-factor-qr-code', 'user/two-factor-secret-key', 'user/two-factor-recovery-codes', 'settings',
            'settings/profile', 'settings/password', 'settings/appearance', 'settings/security', 'settings/notifications',
            'push-subscriptions', 'up', 'storage/{path}',
        ];

        $unknown = collect(Route::getRoutes()->getRoutes())
            ->map(fn ($route) => $route->uri())
            ->unique()
            ->reject(fn (string $uri) => in_array($uri, [...$clubData, ...$noClubData], true))
            ->values()
            ->all();

        $this->assertSame([], $unknown, 'Routes without a club isolation decision: '.implode(', ', $unknown));
    }
}
