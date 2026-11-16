<?php

namespace Tests;

use App\Models\Group;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }

    /** Id of one of the groups every database starts with ("Big pool", "Small pool"). */
    protected function group(string $name): int
    {
        return Group::where('name', $name)->value('id');
    }
}
