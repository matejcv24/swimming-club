<?php

namespace App\Http\Controllers;

use App\Models\Member;
use Illuminate\Http\Request;
use App\Mail\ParentInvite;
use App\Models\ClubParent;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class MemberController extends Controller
{
    public function index()
    {
        $members = Member::with('parent')->get();

        return inertia('members/index', [
            'members' => $members,
        ]);
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'pool'         => ['required', 'in:big,small'],
            'parent_name'  => ['required', 'string', 'max:255'],
            'parent_email' => ['nullable', 'sometimes', 'email', 'unique:parents,email'],
            'parent_phone' => ['required', 'string', 'max:20'],
        ]);

        // Create parent record
        $parent = ClubParent::create([
            'name'       => $validated['parent_name'],
            'email'      => $validated['parent_email'] ?? null,
            'phone'      => $validated['parent_phone'],
            'invited_at' => !empty($validated['parent_email']) ? now() : null,
        ]);

        // Only send invite email if parent email was provided
        if (!empty($validated['parent_email'])) {
            $inviteUrl = URL::temporarySignedRoute(
                'claim.account',
                now()->addHours(72),
                ['parent' => $parent->id]
            );
            Mail::to($parent->email)->send(new ParentInvite($parent, $inviteUrl));
        }

        // Create member linked to parent
        Member::create([
            'name'      => $validated['name'],
            'pool'      => $validated['pool'],
            'parent_id' => $parent->id,
        ]);

        return back()->with('success', 'Member added successfully!');
    }

    public function show(string $id)
    {
        //
    }

    public function edit(string $id)
    {
        //
    }
public function update(Request $request, Member $member)
{
    $validated = $request->validate([
        'name'         => ['required', 'string', 'max:255'],
        'pool'         => ['required', 'in:big,small'],
        'parent_name'  => ['required', 'string', 'max:255'],
        'parent_email' => ['nullable', 'email'],
        'parent_phone' => ['required', 'string', 'max:20'],
    ]);

    $member->update([
        'name' => $validated['name'],
        'pool' => $validated['pool'],
    ]);

    if ($member->parent) {
        $member->parent->update([
            'name'  => $validated['parent_name'],
            'email' => $validated['parent_email'] ?? null,
            'phone' => $validated['parent_phone'],
        ]);
    }

    return back()->with('success', 'Member updated!');
}

public function destroy(Member $member)
{
    $member->delete();

    return back()->with('success', 'Member deleted!');
}
}