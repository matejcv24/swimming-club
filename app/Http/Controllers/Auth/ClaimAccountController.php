<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ClubParent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class ClaimAccountController extends Controller
{
public function show(Request $request, ClubParent $parent)
{
    if ($parent->claimed_at) {
        return redirect('/dashboard')->with('info', 'Account already activated.');
    }

    return inertia('auth/claim-account', [
        'parentName'  => $parent->name,
        'parentEmail' => $parent->email,
        'parentId'    => $parent->id,
        'signature'   => $request->query('signature'),
        'expires'     => $request->query('expires'),
    ]);
}

public function store(Request $request, ClubParent $parent)
{
    $validated = $request->validate([
        'password' => ['required', 'min:8', 'confirmed'],
    ]);

    // Create the user account
    $user = User::create([
        'name'     => $parent->name,
        'email'    => $parent->email,
        'password' => Hash::make($validated['password']),
        'role'     => 'parent',
    ]);

    // Link user to parent record
    $parent->update([
        'user_id'    => $user->id,
        'claimed_at' => now(),
    ]);

    Auth::login($user);

    return redirect('/dashboard');
}
}