<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Editing a staff member can change their role: admin <-> coach. */
class StaffRoleChangeTest extends TestCase
{
    use RefreshDatabase;

    private function details(User $user, array $extra = []): array
    {
        return ['name' => $user->name, 'email' => $user->email, 'password' => '', ...$extra];
    }

    public function test_a_coach_becomes_an_admin_and_sees_every_group()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach', 'all_groups' => false]);
        $coach->coachGroups()->sync([$this->group('Big pool')]);

        $this->actingAs($admin)->put("/staff/{$coach->id}", $this->details($coach, ['role' => 'admin']))
            ->assertSessionHasNoErrors();

        $coach = $coach->fresh();
        $this->assertSame('admin', $coach->role);
        $this->assertTrue($coach->all_groups);
        $this->assertSame(0, $coach->coachGroups()->count());
        $this->actingAs($coach)->get('/staff')->assertOk();
    }

    public function test_an_admin_becomes_a_coach_with_chosen_groups()
    {
        $owner = User::factory()->create(['role' => 'admin']);
        Club::current()->forceFill(['owner_id' => $owner->id])->save();
        $other = User::factory()->create(['role' => 'admin']);
        $group = Group::create(['name' => 'Advanced'])->id;

        // A coach needs groups (or all groups)
        $this->actingAs($owner)->put("/staff/{$other->id}", $this->details($other, ['role' => 'coach']))
            ->assertSessionHasErrors('all_groups');

        $this->actingAs($owner)->put("/staff/{$other->id}", $this->details($other, ['role' => 'coach', 'all_groups' => false, 'group_ids' => [$group]]))
            ->assertSessionHasNoErrors();

        $other = $other->fresh();
        $this->assertSame('coach', $other->role);
        $this->assertSame([$group], $other->visibleGroupIds());
        $this->actingAs($other)->get('/staff')->assertForbidden();
    }

    public function test_nobody_changes_their_own_role_or_the_owners()
    {
        $owner = User::factory()->create(['role' => 'admin']);
        Club::current()->forceFill(['owner_id' => $owner->id])->save();
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->put("/staff/{$admin->id}", $this->details($admin, ['role' => 'coach', 'all_groups' => true]))
            ->assertSessionHasErrors('role');
        $this->assertSame('admin', $admin->fresh()->role);

        $this->actingAs($owner)->put("/staff/{$owner->id}", $this->details($owner, ['role' => 'coach', 'all_groups' => true]))
            ->assertSessionHasErrors('role');
        $this->assertSame('admin', $owner->fresh()->role);
    }

    public function test_an_unknown_role_is_refused_and_editing_without_a_role_keeps_it()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($admin)->put("/staff/{$coach->id}", $this->details($coach, ['role' => 'owner', 'all_groups' => true]))
            ->assertSessionHasErrors('role');

        $this->actingAs($admin)->put("/staff/{$coach->id}", $this->details($coach, ['name' => 'Renamed', 'all_groups' => true]))
            ->assertSessionHasNoErrors();
        $this->assertSame('coach', $coach->fresh()->role);
        $this->assertSame('Renamed', $coach->fresh()->name);
    }
}
