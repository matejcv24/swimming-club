<?php

namespace App\Http\Controllers;

use App\Models\ClubParent;
use App\Models\Member;
use App\Models\User;
use App\Notifications\MemberChangedNotification;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MemberController extends Controller
{
    public function index()
    {
        $members = Member::with('parent')->get();

        return inertia('members/index', [
            'members' => $members,
            'userRole' => Auth::user()->role,
        ]);
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
            'parent_phone' => ['required', 'string', 'max:20'],
        ]);

        $parent = ClubParent::create([
            'name' => $validated['parent_name'],
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
                    Auth::user()->name . ' added a new member ' . $member->name,
                    '/members?member=' . $member->id
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
                'phone' => $validated['parent_phone'],
            ]);
        }

        if (Auth::user()?->role === 'coach' && count($changes) > 0) {
            $admins = User::where('role', 'admin')->get();
            $changeSummary = implode(', ', $changes);

            foreach ($admins as $admin) {
                $admin->notify(new MemberChangedNotification(
                    Auth::user()->name . ' updated ' . $changeSummary . ' for ' . $member->name,
                    '/members?member=' . $member->id
                ));
            }
        }

        return back()->with('success', 'Member updated!');
    }

    public function destroy(Member $member)
    {
        DB::transaction(function () use ($member) {
            $member->attendances()->delete();
            $member->membershipFees()->delete();

            // Remove notifications that link to this member, they would point to nothing
            DatabaseNotification::query()
                ->where('data', 'like', '%member=' . $member->id . '%')
                ->get()
                ->filter(function (DatabaseNotification $notification) use ($member) {
                    parse_str((string) parse_url($notification->data['url'] ?? '', PHP_URL_QUERY), $query);

                    return (int) ($query['member'] ?? 0) === $member->id;
                })
                ->each->delete();

            $parent = $member->parent;

            $member->delete();

            if ($parent && !$parent->members()->exists()) {
                $parent->delete();
            }
        });

        return back()->with('success', 'Member deleted!');
    }
}
