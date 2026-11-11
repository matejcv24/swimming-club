<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AppearanceController extends Controller
{
    /**
     * Remember the user's light/dark choice so it follows them to every login.
     */
    public function update(Request $request): Response
    {
        $validated = $request->validate([
            'appearance' => ['required', 'in:light,dark,system'],
        ]);

        $request->user()->update(['appearance' => $validated['appearance']]);

        return response()->noContent();
    }
}
