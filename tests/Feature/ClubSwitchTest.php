<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\ClubNotification;
use App\Models\Member;
use App\Models\User;
use App\Support\CurrentClub;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/** "My clubs" in the avatar menu: someone in several clubs works in one at a time. */
class ClubSwitchTest extends TestCase
{
    use RefreshDatabase;

    private Club $a;

    private Club $b;

    private User $person;

    protected function setUp(): void
    {
        parent::setUp();

        $this->a = Club::first();
        $this->b = Club::create(['name' => 'ПК Водник', 'slug' => 'vodnik']);

        $this->person = CurrentClub::runFor($this->a, fn () => User::factory()->create(['role' => 'admin']));
        CurrentClub::runFor($this->b, function () {
            $this->person->forceFill(['role' => 'coach'])->save();
            Member::create(['name' => 'Vodnik Swimmer', 'status' => 'active']);
        });
    }

    private function notifyIn(Club $club): ClubNotification
    {
        return CurrentClub::runFor($club, fn () => ClubNotification::create([
            'id' => (string) Str::uuid(), 'type' => 'test', 'notifiable_type' => User::class,
            'notifiable_id' => $this->person->id, 'data' => ['message' => 'Hi', 'type' => 'member_changed', 'url' => '/members'],
        ]));
    }

    public function test_the_menu_lists_both_clubs_with_the_role_and_unread_of_each()
    {
        $this->notifyIn($this->b);
        $this->notifyIn($this->b);

        $this->actingAs($this->person)->get('/dashboard')->assertInertia(fn ($page) => $page
            ->has('myClubs', 2)
            ->where('myClubs.0.name', $this->a->name)
            ->where('myClubs.0.role', 'admin')
            ->where('myClubs.0.current', true)
            ->where('myClubs.1.name', 'ПК Водник')
            ->where('myClubs.1.role', 'coach')
            ->where('myClubs.1.current', false)
            ->where('myClubs.1.unread', 2));
    }

    public function test_someone_with_one_club_gets_no_list()
    {
        $solo = CurrentClub::runFor($this->a, fn () => User::factory()->create(['role' => 'admin']));

        $this->actingAs($solo)->get('/dashboard')->assertInertia(fn ($page) => $page->has('myClubs', 0));
    }

    public function test_switching_works_in_the_other_club_and_says_so()
    {
        $this->actingAs($this->person)->post("/clubs/{$this->b->id}/switch")
            ->assertRedirect('/dashboard')
            ->assertSessionHas('club_switched', 'ПК Водник');

        $this->get('/members')->assertOk()->assertSee('Vodnik Swimmer');
        $this->get('/staff')->assertForbidden();
        $this->get('/dashboard')->assertInertia(fn ($page) => $page->where('myClubs.1.current', true));
    }

    public function test_switching_to_a_club_one_is_not_active_in_is_not_found()
    {
        $other = Club::create(['name' => 'Other', 'slug' => 'other']);
        $this->actingAs($this->person)->post("/clubs/{$other->id}/switch")->assertNotFound();

        CurrentClub::runFor($this->b, fn () => $this->person->forceFill(['deactivated_at' => now()])->save());
        $this->actingAs($this->person)->post("/clubs/{$this->b->id}/switch")->assertNotFound();
    }

    public function test_opening_a_notification_of_the_other_club_switches_to_it()
    {
        $notification = $this->notifyIn($this->b);

        $this->actingAs($this->person)->get("/notifications/{$notification->id}/open")->assertRedirect('/members');

        $this->assertNotNull(ClubNotification::withoutGlobalScope('club')->find($notification->id)->read_at);
        $this->get('/members')->assertSee('Vodnik Swimmer');
    }
}
