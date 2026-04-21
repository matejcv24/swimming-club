<?php

namespace App\Http\Controllers;

use App\Mail\CoachInviteMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class StaffController extends Controller
{
    public function index()
    {
        $staff = User::where('role', 'coach')->get();

        return inertia('staff/index', [
            'staff' => $staff,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
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
            'signature' => $request->query('signature'),
            'expires' => $request->query('expires'),
        ]);
    }

    public function claimAccount(Request $request, User $coach)
    {
        if ($coach->role !== 'coach') {
            abort(403);
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($coach->password) {
            return redirect()
                ->route('login')
                ->with('status', 'This account has already been activated.');
        }

        $coach->update([
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        Auth::login($coach);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }
}