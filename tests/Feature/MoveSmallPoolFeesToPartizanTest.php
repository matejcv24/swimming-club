<?php

namespace Tests\Feature;

use App\Models\ClubParent;
use App\Models\Group;
use App\Models\Member;
use App\Models\MembershipFee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MoveSmallPoolFeesToPartizanTest extends TestCase
{
    use RefreshDatabase;

    private function fee(Member $member, int $groupId, string $start, string $end): MembershipFee
    {
        return MembershipFee::create([
            'member_id' => $member->id, 'member_name' => $member->name, 'group_id' => $groupId,
            'amount' => 1500, 'payment_method' => 'cash', 'start_date' => $start, 'end_date' => $end,
        ]);
    }

    public function test_october_and_november_small_pool_fees_move_to_partizan()
    {
        $small = $this->group('Small pool');
        $big = $this->group('Big pool');
        $partizan = Group::create(['name' => 'Partizan', 'position' => 3])->id;
        $parent = ClubParent::create(['name' => 'Parent', 'phone' => '070000000']);
        $ana = Member::create(['name' => 'Ana', 'group_id' => $partizan, 'status' => 'active', 'parent_id' => $parent->id]);

        $september = $this->fee($ana, $small, '2026-09-01', '2026-09-30');
        $october = $this->fee($ana, $small, '2026-10-01', '2026-10-31');
        $november = $this->fee($ana, $small, '2026-11-15', '2026-12-14');
        $december = $this->fee($ana, $small, '2026-12-01', '2026-12-31');
        $bigOctober = $this->fee($ana, $big, '2026-10-01', '2026-10-31');

        (require database_path('migrations/2026_11_19_000002_move_small_pool_fees_to_partizan.php'))->up();

        $this->assertSame($small, $september->fresh()->group_id);
        $this->assertSame($partizan, $october->fresh()->group_id);
        $this->assertSame($partizan, $november->fresh()->group_id);
        $this->assertSame($small, $december->fresh()->group_id);
        $this->assertSame($big, $bigOctober->fresh()->group_id);
        $this->assertSame(1500.0, $october->fresh()->amount);
        $this->assertSame(5, MembershipFee::count());
    }
}
