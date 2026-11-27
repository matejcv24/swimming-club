<?php

namespace Tests\Feature;

use App\Models\Salary;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class RemoveParentRoleMigrationTest extends TestCase
{
    use RefreshDatabase;

    /** An account with the old users.role column set (as before club memberships). */
    private function userWithOldRole(string $role): User
    {
        $user = User::factory()->create();
        DB::table('users')->where('id', $user->id)->update(['role' => $role]);

        return $user;
    }

    private function runMigration(): void
    {
        $migration = require database_path('migrations/2026_10_26_000001_remove_parent_role_from_users_table.php');
        $migration->up();
    }

    public function test_parent_users_are_deleted_and_others_are_kept()
    {
        $parent = $this->userWithOldRole('parent');
        $admin = $this->userWithOldRole('admin');
        $coach = $this->userWithOldRole('coach');

        $this->runMigration();

        $this->assertModelMissing($parent);
        $this->assertModelExists($admin);
        $this->assertModelExists($coach);
    }

    public function test_nothing_is_deleted_when_a_parent_user_owns_salaries()
    {
        $parent = $this->userWithOldRole('parent');
        Salary::create(['user_id' => $parent->id, 'amount' => 1000, 'month' => '2026-10-01']);

        try {
            $this->runMigration();
            $this->fail('The migration should have stopped.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('Nothing was deleted', $e->getMessage());
        }

        $this->assertModelExists($parent);
        $this->assertDatabaseCount('salaries', 1);
    }
}
