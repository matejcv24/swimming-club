<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberContactTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_member_can_have_their_own_phone_and_email()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post('/members', [
            'name' => 'Adult Swimmer', 'group_id' => Group::create(['name' => 'Masters'])->id,
            'phone' => '070123456', 'email' => 'adult@example.com',
        ])->assertSessionHasNoErrors();

        $member = Member::where('name', 'Adult Swimmer')->first();
        $this->assertSame('070123456', $member->phone);
        $this->assertSame('adult@example.com', $member->email);
        $this->assertNull($member->parent_id);
    }

    public function test_contact_details_are_optional_and_the_email_must_be_valid()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post('/members', ['name' => 'Only Name'])->assertSessionHasNoErrors();
        $this->assertNull(Member::where('name', 'Only Name')->first()->email);

        $this->actingAs($admin)->post('/members', ['name' => 'Bad', 'email' => 'nope'])->assertSessionHasErrors('email');
        $this->actingAs($admin)->post('/members', ['name' => 'Bad', 'parent_email' => 'nope'])->assertSessionHasErrors('parent_email');
    }

    public function test_siblings_can_share_a_parent_email()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        foreach (['Kid One', 'Kid Two'] as $name) {
            $this->actingAs($admin)->post('/members', [
                'name' => $name, 'parent_name' => 'Parent', 'parent_email' => 'parent@example.com',
            ])->assertSessionHasNoErrors();
        }

        $this->assertSame('parent@example.com', Member::where('name', 'Kid Two')->first()->parent->email);
    }

    public function test_updating_changes_the_contact_details_and_parent_email()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = Member::create(['name' => 'Ana', 'status' => 'active']);

        $this->actingAs($admin)->patch("/members/{$member->id}", [
            'name' => 'Ana', 'status' => 'active', 'phone' => '071', 'email' => 'ana@example.com',
            'parent_name' => 'Mama', 'parent_email' => 'mama@example.com',
        ])->assertSessionHasNoErrors();

        $member->refresh();
        $this->assertSame('ana@example.com', $member->email);
        $this->assertSame('mama@example.com', $member->parent->email);
    }

    public function test_the_unpaid_list_offers_the_members_own_phone_for_calling()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Member::create(['name' => 'Adult', 'status' => 'active', 'phone' => '070111222']);

        $this->actingAs($admin)->get('/unpaid-fees')->assertInertia(fn ($page) => $page
            ->where('unpaidMembers.0.name', 'Adult')
            ->where('unpaidMembers.0.phone', null)
            ->where('unpaidMembers.0.memberPhone', '070111222')
            ->where('unpaidMembers.0.parentName', null));
    }
}
