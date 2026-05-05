<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class CoachAccountClaimController extends Controller
{
    public function store(Request $request, User $coach): JsonResponse
    {
        if ($coach->role !== 'coach') {
            abort(403);
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($coach->password) {
            return response()->json([
                'message' => 'This account has already been activated.',
                'redirect' => route('login'),
            ], 409);
        }

        $coach->update([
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        Auth::login($coach);
        $request->session()->regenerate();

        return response()->json([
            'redirect' => route('dashboard'),
        ]);
    }
}
