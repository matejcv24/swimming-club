<?php

namespace App\Http\Controllers;

use App\Models\ClubParent;
use App\Models\Member;
use App\Models\User;
use App\Notifications\MemberChangedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MemberController extends Controller
{
    public function index()
    {
        return inertia('members/index');
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'pool' => ['required', 'in:big,small'],
            'parent_name' => ['required', 'string', 'max:255'],
            'parent_email' => ['nullable', 'sometimes', 'email', 'unique:parents,email'],
            'parent_phone' => ['required', 'string', 'max:20'],
        ]);

        $parent = ClubParent::create([
            'name' => $validated['parent_name'],
            'email' => $validated['parent_email'] ?? null,
            'phone' => $validated['parent_phone'],
        ]);

        $member = Member::create([
            'name' => $validated['name'],
            'pool' => $validated['pool'],
            'status' => 'active',
            'parent_id' => $parent->id,
        ]);

        if (Auth::user()?->role === 'coach') {
            $admins = User::where('role', 'admin')->get();

            foreach ($admins as $admin) {
                $admin->notify(new MemberChangedNotification(
                    Auth::user()->name.' added a new member '.$member->name,
                    '/members?member='.$member->id
                ));
            }
        }

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
            'name' => ['required', 'string', 'max:255'],
            'pool' => ['required', 'in:big,small'],
            'status' => ['required', 'in:active,inactive'],
            'parent_name' => ['required', 'string', 'max:255'],
            'parent_email' => ['nullable', 'email'],
            'parent_phone' => ['required', 'string', 'max:20'],
        ]);

        $changes = [];

        if ($member->name !== $validated['name']) {
            $changes[] = 'name';
        }

        if ($member->pool !== $validated['pool']) {
            $changes[] = 'pool';
        }

        if ($member->status !== $validated['status']) {
            $changes[] = 'status';
        }

        if (($member->parent?->name ?? '') !== $validated['parent_name']) {
            $changes[] = 'parent name';
        }

        if (($member->parent?->email ?? '') !== ($validated['parent_email'] ?? null)) {
            $changes[] = 'parent email';
        }

        if (($member->parent?->phone ?? '') !== $validated['parent_phone']) {
            $changes[] = 'parent phone';
        }

        $member->update([
            'name' => $validated['name'],
            'pool' => $validated['pool'],
            'status' => $validated['status'],
        ]);

        if ($member->parent) {
            $member->parent->update([
                'name' => $validated['parent_name'],
                'email' => $validated['parent_email'] ?? null,
                'phone' => $validated['parent_phone'],
            ]);
        }

        if (Auth::user()?->role === 'coach' && count($changes) > 0) {
            $admins = User::where('role', 'admin')->get();
            $changeSummary = implode(', ', $changes);

            foreach ($admins as $admin) {
                $admin->notify(new MemberChangedNotification(
                    Auth::user()->name.' updated '.$changeSummary.' for '.$member->name,
                    '/members?member='.$member->id
                ));
            }
        }

        return back()->with('success', 'Member updated!');
    }

    public function destroy(Member $member)
    {
        abort(403, 'Deleting members is not allowed.');
    }
}
