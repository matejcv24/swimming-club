<?php

namespace App\Http\Controllers;

use App\Mail\CoachInvite;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

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

        // Create coach user without password
        $coach = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => null,
            'role'     => 'coach',
        ]);

        // Generate signed invite URL
        $inviteUrl = URL::temporarySignedRoute(
            'claim.coach.account',
            now()->addHours(72),
            ['coach' => $coach->id]
        );

        // Send invite email
        Mail::to($coach->email)->send(new CoachInvite($coach, $inviteUrl));

        return back()->with('success', 'Coach invited successfully!');
    }
}