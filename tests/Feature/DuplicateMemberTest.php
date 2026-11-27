<?php

namespace Tests\Feature;

use App\Models\ClubParent;
use App\Models\Group;
use App\Models\Member;
use App\Models\User;
use App\Support\DuplicateMembers;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DuplicateMemberTest extends TestCase
{
    use RefreshDatabase;

    private function existing(): Member
    {
        $parent = ClubParent::create(['name' => 'Goran', 'phone' => '070 123 456', 'email' => 'goran@example.com']);

        return Member::create(['name' => 'Ана Петрова', 'status' => 'active', 'parent_id' => $parent->id]);
    }

    public function test_names_and_phones_are_compared_however_they_are_written()
    {
        $this->assertSame(DuplicateMembers::nameKey('Ана Петрова'), DuplicateMembers::nameKey('  petrova, ANA '));
        $this->assertSame(DuplicateMembers::nameKey('Ѓорѓи Шишков'), DuplicateMembers::nameKey('Gjorgji Šiškov'));
        $this->assertSame('070123456', DuplicateMembers::phoneKey('+389 70 123 456'));
        $this->assertSame('070123456', DuplicateMembers::phoneKey('00389 70-123-456'));
        $this->assertSame('070123456', DuplicateMembers::phoneKey('070/123 456'));
    }

    public function test_same_name_and_same_parent_phone_is_refused_with_the_existing_member()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $existing = $this->existing();

        $response = $this->actingAs($admin)->post('/members', [
            'name' => 'Ana Petrova', 'parent_name' => 'Goran', 'parent_phone' => '+38970123456',
        ]);

        $response->assertSessionHasErrors('duplicate');
        $matches = json_decode(session('errors')->first('duplicate'), true);
        $this->assertSame($existing->id, $matches[0]['id']);
        $this->assertTrue($matches[0]['canOpen']);
        $this->assertSame(1, Member::count());
    }

    public function test_the_member_phone_can_match_the_parent_phone_and_emails_too()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->existing();

        $this->actingAs($admin)->post('/members', ['name' => 'Ana Petrova', 'phone' => '070123456'])
            ->assertSessionHasErrors('duplicate');
        $this->actingAs($admin)->post('/members', ['name' => 'Ana Petrova', 'email' => 'GORAN@example.com'])
            ->assertSessionHasErrors('duplicate');
        $this->assertSame(1, Member::count());
    }

    public function test_same_name_alone_or_same_contact_alone_is_not_a_duplicate()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->existing();

        // Namesakes with no contact, or another family
        $this->actingAs($admin)->post('/members', ['name' => 'Ана Петрова'])->assertSessionHasNoErrors();
        $this->actingAs($admin)->post('/members', ['name' => 'Ана Петрова', 'parent_phone' => '071999888'])->assertSessionHasNoErrors();
        // A sibling: same parent, another name
        $this->actingAs($admin)->post('/members', ['name' => 'Марко Петров', 'parent_phone' => '070123456'])->assertSessionHasNoErrors();

        $this->assertSame(4, Member::count());
    }

    public function test_confirming_twice_adds_the_member_anyway()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->existing();

        $this->actingAs($admin)->post('/members', [
            'name' => 'Ana Petrova', 'parent_phone' => '070123456', 'confirm_duplicate' => true,
        ])->assertSessionHasNoErrors();

        $this->assertSame(2, Member::count());
    }

    public function test_editing_into_a_duplicate_is_refused_but_other_edits_are_not()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $existing = $this->existing();
        $other = Member::create(['name' => 'Ana P', 'status' => 'active', 'phone' => '070123456']);

        $this->actingAs($admin)->patch("/members/{$other->id}", [
            'name' => 'Ana Petrova', 'status' => 'active', 'phone' => '070123456',
        ])->assertSessionHasErrors('duplicate');
        $this->assertSame('Ana P', $other->fresh()->name);

        // Saving a member without changing its name or contacts is never blocked
        $this->actingAs($admin)->patch("/members/{$existing->id}", [
            'name' => 'Ана Петрова', 'status' => 'inactive',
            'parent_name' => 'Goran', 'parent_phone' => '070 123 456', 'parent_email' => 'goran@example.com',
        ])->assertSessionHasNoErrors();
        $this->assertSame('inactive', $existing->fresh()->status);
    }

    public function test_a_coach_is_warned_without_the_details_of_a_member_they_cant_see()
    {
        $mine = Group::create(['name' => 'Mine']);
        $theirs = Group::create(['name' => 'Theirs']);
        $coach = User::factory()->create(['role' => 'coach', 'all_groups' => false]);
        $coach->coachGroups()->sync([$mine->id]);
        $existing = $this->existing();
        $existing->update(['group_id' => $theirs->id]);

        $response = $this->actingAs($coach)->post('/members', [
            'name' => 'Ana Petrova', 'group_id' => $mine->id, 'parent_phone' => '070123456',
        ]);

        $response->assertSessionHasErrors('duplicate');
        $match = json_decode(session('errors')->first('duplicate'), true)[0];
        $this->assertFalse($match['canOpen']);
        $this->assertNull($match['parent']);
    }
}
