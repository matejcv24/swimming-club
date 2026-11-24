<?php

namespace Tests\Feature;

use App\Models\ClubParent;
use App\Models\Group;
use App\Models\Invoice;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GroupTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function member(string $name, int $groupId): Member
    {
        $parent = ClubParent::create(['name' => 'Parent of '.$name, 'phone' => '070000000']);

        return Member::create(['name' => $name, 'group_id' => $groupId, 'status' => 'active', 'parent_id' => $parent->id]);
    }

    public function test_admin_can_add_rename_and_list_groups()
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post('/groups', ['name' => 'Mon-Wed-Fri'])->assertSessionHasNoErrors();
        $group = Group::where('name', 'Mon-Wed-Fri')->firstOrFail();
        $this->assertSame(3, $group->position);

        $this->actingAs($admin)->put("/groups/{$group->id}", ['name' => '18:00'])->assertSessionHasNoErrors();
        $this->assertSame('18:00', $group->fresh()->name);

        $this->actingAs($admin)
            ->get('/trainings')
            ->assertInertia(fn (Assert $page) => $page
                ->where('groups.2.name', '18:00')
                ->where('groups.2.members_count', 0));
    }

    public function test_only_admins_open_the_groups_page_from_the_dashboard()
    {
        $ana = $this->member('Ana', $this->group('Big pool'));
        // Inactive members are not listed
        $this->member('Old Bojan', $this->group('Big pool'))->update(['status' => 'inactive']);

        $this->actingAs($this->admin())
            ->get('/groups')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('groups/index')
                ->has('groups', 2)
                // Each group's members can be listed, with their details
                ->has('members', 1)
                ->where('members.0.id', $ana->id)
                ->where('members.0.group_id', $this->group('Big pool'))
                ->where('members.0.parent.name', 'Parent of Ana')
                // The dashboard is drawn behind the pop-up
                ->has('dashboardSummary'));

        $this->actingAs(User::factory()->create(['role' => 'coach']))
            ->get('/groups')
            ->assertForbidden();
    }

    public function test_group_names_must_be_unique_and_present()
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post('/groups', ['name' => 'Big pool'])->assertSessionHasErrors('name');
        $this->actingAs($admin)->post('/groups', ['name' => ''])->assertSessionHasErrors('name');
    }

    public function test_coaches_cannot_manage_groups()
    {
        $coach = User::factory()->create(['role' => 'coach']);
        $big = $this->group('Big pool');

        $this->actingAs($coach)->post('/groups', ['name' => 'Coach group'])->assertForbidden();
        $this->actingAs($coach)->put("/groups/{$big}", ['name' => 'Renamed'])->assertForbidden();
        $this->actingAs($coach)->delete("/groups/{$big}")->assertForbidden();

        $this->assertSame('Big pool', Group::find($big)->name);
    }

    public function test_deleting_a_group_moves_its_members_and_keeps_history()
    {
        $admin = $this->admin();
        $big = $this->group('Big pool');
        $small = $this->group('Small pool');
        $ana = $this->member('Ana', $big);
        MembershipFee::create(['member_id' => $ana->id, 'member_name' => 'Ana', 'group_id' => $big, 'amount' => 2000, 'payment_method' => 'cash', 'start_date' => '2026-10-01', 'end_date' => '2026-10-31']);

        // Members must go somewhere first
        $this->actingAs($admin)->delete("/groups/{$big}")->assertSessionHasErrors('move_to_group_id');
        $this->actingAs($admin)->delete("/groups/{$big}", ['move_to_group_id' => $big])->assertSessionHasErrors('move_to_group_id');

        $this->actingAs($admin)->delete("/groups/{$big}", ['move_to_group_id' => $small])->assertSessionHasNoErrors();

        $this->assertSame($small, $ana->fresh()->group_id);
        $this->assertSoftDeleted('groups', ['id' => $big]);
        $this->assertSame('Big pool', MembershipFee::first()->group->name);
        $this->assertSame(1, Group::count());
    }

    public function test_an_empty_group_can_be_deleted_without_moving_anyone()
    {
        $admin = $this->admin();
        $group = Group::create(['name' => 'Saturday', 'position' => 3]);

        $this->actingAs($admin)->delete("/groups/{$group->id}")->assertSessionHasNoErrors();

        $this->assertSoftDeleted('groups', ['id' => $group->id]);
    }

    public function test_a_members_group_must_be_in_use()
    {
        $admin = $this->admin();
        $deleted = Group::create(['name' => 'Old', 'position' => 3]);
        $deleted->delete();

        $payload = ['name' => 'Mia', 'parent_name' => 'Parent', 'parent_phone' => '070111222'];

        // (No group at all means all groups: see AllGroupsMemberTest)
        $this->actingAs($admin)->post('/members', [...$payload, 'group_id' => $deleted->id])->assertSessionHasErrors('group_id');
        $this->actingAs($admin)->post('/members', [...$payload, 'group_id' => $this->group('Small pool')])->assertSessionHasNoErrors();

        $this->assertSame($this->group('Small pool'), Member::where('name', 'Mia')->value('group_id'));
    }

    public function test_invoices_can_have_a_group_or_none_and_add_up()
    {
        $admin = $this->admin();
        $big = $this->group('Big pool');

        $this->actingAs($admin)->postJson('/invoices', ['month' => '2026-10-01', 'amount' => 5000])->assertCreated();
        $this->actingAs($admin)->postJson('/invoices', ['month' => '2026-10-01', 'group_id' => $big, 'amount' => 12000])->assertCreated();

        // Recording the same month and group again updates it
        $this->actingAs($admin)->postJson('/invoices', ['month' => '2026-10-01', 'group_id' => $big, 'amount' => 13000])->assertOk();
        $this->actingAs($admin)->postJson('/invoices', ['month' => '2026-10-01', 'amount' => 6000])->assertOk();

        $this->assertSame(2, Invoice::count());
        $this->actingAs($admin)
            ->getJson('/invoices/by-month/2026-10-01')
            ->assertJsonPath('total', 19000)
            ->assertJsonCount(2, 'invoices');
    }

    public function test_even_the_last_group_can_be_deleted_its_members_going_to_all_groups()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Group::query()->delete();
        $last = Group::create(['name' => 'Only group']);
        $evening = Group::create(['name' => '18:00', 'parent_id' => $last->id]);
        $member = Member::create(['name' => 'Ana', 'status' => 'active', 'group_id' => $last->id, 'subgroup_id' => $evening->id]);

        $this->actingAs($admin)->delete("/groups/{$last->id}", ['move_to_group_id' => 'all'])->assertSessionHasNoErrors();

        $this->assertSoftDeleted($last);
        $this->assertSoftDeleted($evening);
        $member->refresh();
        $this->assertNull($member->group_id);
        $this->assertNull($member->subgroup_id);
    }
}
