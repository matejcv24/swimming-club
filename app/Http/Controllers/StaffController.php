<?php

namespace App\Http\Controllers;

use App\Mail\CoachInviteMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class StaffController extends Controller
{
    public function index()
    {
        return inertia('staff/index');
    }

    public function store(Request $request)
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

        return back()->with('success', 'Coach invited successfully!');
    }

    public function showClaimForm(Request $request, User $coach)
    {
        if ($coach->role !== 'coach') {
            abort(403);
        }

        return Inertia::render('auth/claim-coach-account', [
            'coachName' => $coach->name,
            'coachEmail' => $coach->email,
            'coachId' => $coach->id,
            'claimUrl' => URL::temporarySignedRoute(
                'api.claim-coach-account.store',
                Carbon::createFromTimestamp((int) $request->query('expires')),
                ['coach' => $coach->id]
            ),
        ]);
    }
}
