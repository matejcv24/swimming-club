<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class QuickActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_add_payment_shows_only_the_form_without_the_history()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->get('/membership-fees?add=1')
            ->assertInertia(fn (Assert $page) => $page->where('allFees', null));

        // The full pop-up still loads the history, right after the page
        $this->actingAs($admin)->get('/membership-fees')
            ->assertInertia(fn (Assert $page) => $page->missing('allFees'));
    }
}
