<?php

namespace App\Http\Controllers;

use App\Mail\ParentInvite;
use App\Models\ClubParent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class ClubParentController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:parents,email'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        // Create the parent record
        $parent = ClubParent::create([
            ...$validated,
            'invited_at' => now(),
        ]);

        // Generate signed invite URL valid for 72 hours
        $inviteUrl = URL::temporarySignedRoute(
            'claim.account',
            now()->addHours(72),
            ['parent' => $parent->id]
        );

        // Send invite email
        Mail::to($parent->email)->send(new ParentInvite($parent, $inviteUrl));

        return back()->with('success', 'Parent added and invite email sent!');
    }
}