<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\Group;
use App\Models\Member;
use App\Models\User;
use App\Support\ClubAccess;
use App\Support\CurrentClub;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Demo, grace and read-only: what a club may do as its subscription runs out. */
class ClubAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_existing_club_is_free_for_good_and_never_sees_a_banner()
    {
        $club = Club::first();

        $this->assertSame('comped', ClubAccess::for($club)->state);
        $this->assertNull(ClubAccess::for($club)->banner());
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/dashboard')->assertInertia(fn ($page) => $page->where('clubAccess', null));
    }

    public function test_a_new_club_gets_a_three_month_demo()
    {
        $club = Club::create(['name' => 'New club', 'slug' => 'new-club']);

        $this->assertSame('demo', $club->subscription->status);
        $this->assertTrue($club->subscription->demo_ends_at->isSameDay(now()->addMonths(3)));
        $this->assertSame('demo', ClubAccess::for($club)->state);
        // No banner until two weeks before the end
        $this->assertNull(ClubAccess::for($club)->banner());
    }

    public function test_the_demo_ends_then_three_grace_days_then_read_only()
    {
        $club = Club::create(['name' => 'New club', 'slug' => 'new-club']);
        $club->subscription->update(['demo_ends_at' => now()->addDays(5)]);

        $this->assertSame(['state' => 'demo', 'days_left' => 5], array_intersect_key(ClubAccess::for($club->fresh())->banner(), ['state' => 1, 'days_left' => 1]));

        $this->travel(6)->days();
        $this->assertSame('grace', ClubAccess::for($club->fresh())->state);
        $this->assertTrue(ClubAccess::for($club->fresh())->canWrite());

        $this->travel(3)->days();
        $this->assertSame('read_only', ClubAccess::for($club->fresh())->state);
        $this->assertFalse(ClubAccess::for($club->fresh())->canWrite());
    }

    public function test_a_read_only_club_can_look_but_not_add_change_or_delete()
    {
        $club = Club::create(['name' => 'Expired club', 'slug' => 'expired']);
        $club->subscription->update(['demo_ends_at' => now()->subDays(10)]);

        [$admin, $member] = CurrentClub::runFor($club, function () {
            Group::create(['name' => 'Group']);

            return [User::factory()->create(['role' => 'admin']), Member::create(['name' => 'Ana', 'status' => 'active'])];
        });

        $this->actingAs($admin);
        $this->get('/members')->assertOk()->assertSee('Ana');
        $this->get('/dashboard')->assertInertia(fn ($page) => $page->where('clubAccess.state', 'read_only'));

        $this->post('/members', ['name' => 'New'])->assertSessionHasErrors('club');
        $this->put("/members/{$member->id}", ['name' => 'Changed', 'status' => 'active'])->assertSessionHasErrors('club');
        $this->delete("/members/{$member->id}")->assertSessionHasErrors('club');

        CurrentClub::runFor($club, function () {
            $this->assertSame(['Ana'], Member::pluck('name')->all());
        });

        // Their own account still works
        $this->patch('/settings/profile', ['name' => 'Renamed Admin', 'email' => $admin->email])->assertSessionDoesntHaveErrors('club');
        $this->post('/logout')->assertRedirect();
    }

    public function test_a_suspended_club_is_read_only()
    {
        $club = Club::create(['name' => 'Suspended club', 'slug' => 'suspended']);
        $club->subscription->update(['status' => 'suspended']);

        $this->assertFalse(ClubAccess::for($club->fresh())->canWrite());
    }
}
