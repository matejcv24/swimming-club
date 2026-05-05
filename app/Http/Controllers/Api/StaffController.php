<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\CoachInviteMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class StaffController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'staff' => User::where('role', 'coach')
                ->get()
                ->map(fn (User $coach) => $this->serializeCoach($coach))
                ->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
        ]);

        $coach = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => null,
            'role' => 'coach',
        ]);

        $claimUrl = URL::temporarySignedRoute(
            'claim-coach-account',
            now()->addDays(7),
            ['coach' => $coach->id]
        );

        Mail::to($coach->email)->send(new CoachInviteMail($coach, $claimUrl));

        return response()->json([
            'message' => 'Coach invited successfully!',
            'coach' => $this->serializeCoach($coach),
        ], 201);
    }

    private function serializeCoach(User $coach): array
    {
        return [
            'id' => $coach->id,
            'name' => $coach->name,
            'email' => $coach->email,
            'has_claimed_account' => $coach->password !== null,
        ];
    }
}
