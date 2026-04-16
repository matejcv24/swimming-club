<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class ClaimCoachAccountController extends Controller
{
    public function show(Request $request, User $coach)
    {
        if (!$request->hasValidSignature()) {
            abort(403, 'Invalid or expired invite link.');
        }

        if ($coach->password !== null) {
            return redirect('/dashboard')->with('info', 'Account already activated.');
        }

        return inertia('auth/claim-coach-account', [
            'coachName'  => $coach->name,
            'coachEmail' => $coach->email,
            'coachId'    => $coach->id,
            'signature'  => $request->query('signature'),
            'expires'    => $request->query('expires'),
        ]);
    }

    public function store(Request $request, User $coach)
    {
        $validated = $request->validate([
            'password' => ['required', 'min:8', 'confirmed'],
        ]);

        $coach->update([
            'password' => Hash::make($validated['password']),
        ]);

        Auth::login($coach);

        return redirect('/dashboard');
    }
}