<?php

namespace Tests\Feature;

use App\Models\ClubParent;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MembershipFeeTest extends TestCase
{
    use RefreshDatabase;

    private function createFee(): MembershipFee
    {
        $parent = ClubParent::create(['name' => 'Parent', 'phone' => '070000000']);
        $member = Member::create([
            'name' => 'Swimmer',
            'pool' => 'small',
            'status' => 'active',
            'parent_id' => $parent->id,
        ]);

        return MembershipFee::create([
            'member_id' => $member->id,
            'member_name' => $member->name,
            'pool' => $member->pool,
            'amount' => 1500,
            'payment_method' => 'cash',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-31',
        ]);
    }

    private function validUpdate(array $overrides = []): array
    {
        return [
            'amount' => 1800,
            'payment_method' => 'card',
            'start_date' => '2026-09-15',
            'end_date' => '2026-10-15',
            ...$overrides,
        ];
    }

    public function test_admin_can_edit_membership_fee()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $fee = $this->createFee();

        $this->actingAs($admin)
            ->put("/membership-fees/{$fee->id}", $this->validUpdate())
            ->assertSessionHasNoErrors();

        $fee->refresh();
        $this->assertEquals(1800, $fee->amount);
        $this->assertSame('card', $fee->payment_method);
        $this->assertSame('2026-09-15', $fee->start_date->toDateString());
        $this->assertSame('2026-10-15', $fee->end_date->toDateString());
        $this->assertSame('Swimmer', $fee->member_name);
        $this->assertSame('small', $fee->pool);
    }

    public function test_coach_cannot_edit_membership_fee()
    {
        $coach = User::factory()->create(['role' => 'coach']);
        $fee = $this->createFee();

        $this->actingAs($coach)
            ->put("/membership-fees/{$fee->id}", $this->validUpdate())
            ->assertForbidden();

        $fee->refresh();
        $this->assertEquals(1500, $fee->amount);
        $this->assertSame('cash', $fee->payment_method);
    }

    public function test_edit_is_validated()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $fee = $this->createFee();

        $this->actingAs($admin)
            ->put("/membership-fees/{$fee->id}", $this->validUpdate(['end_date' => '2026-09-01']))
            ->assertSessionHasErrors('end_date');

        $this->actingAs($admin)
            ->put("/membership-fees/{$fee->id}", $this->validUpdate(['payment_method' => 'bitcoin', 'amount' => -5]))
            ->assertSessionHasErrors(['payment_method', 'amount']);

        $this->assertEquals(1500, $fee->fresh()->amount);
    }

    public function test_coach_can_still_record_new_membership_fee()
    {
        $coach = User::factory()->create(['role' => 'coach']);
        $member = $this->createFee()->member;

        $this->actingAs($coach)->post('/membership-fees', [
            'member_id' => $member->id,
            'amount' => 1500,
            'payment_method' => 'cash',
            'start_date' => '2026-11-01',
            'end_date' => '2026-11-30',
        ])->assertSessionHasNoErrors();

        $this->assertSame(2, MembershipFee::count());
    }
}
