<?php

namespace App\Http\Controllers;

use App\Models\ClubParent;
use App\Models\Member;
use Illuminate\Http\Request;

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

        Member::create([
            'name' => $validated['name'],
            'pool' => $validated['pool'],
            'status' => 'active',
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
            'name' => ['required', 'string', 'max:255'],
            'pool' => ['required', 'in:big,small'],
            'status' => ['required', 'in:active,inactive'],
            'parent_name' => ['required', 'string', 'max:255'],
            'parent_email' => ['nullable', 'email'],
            'parent_phone' => ['required', 'string', 'max:20'],
        ]);

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

        return back()->with('success', 'Member updated!');
    }

    public function destroy(Member $member)
    {
        abort(403, 'Deleting members is not allowed.');
    }
}