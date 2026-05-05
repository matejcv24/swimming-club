<?php

namespace App\Http\Controllers;

use App\Actions\Members\CreateMember;
use App\Actions\Members\UpdateMember;
use App\Models\Member;
use Illuminate\Http\Request;

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

    public function store(Request $request, CreateMember $createMember)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'pool' => ['required', 'in:big,small'],
            'parent_name' => ['required', 'string', 'max:255'],
            'parent_email' => ['nullable', 'sometimes', 'email', 'unique:parents,email'],
            'parent_phone' => ['required', 'string', 'max:20'],
        ]);

        $createMember->handle($validated, $request->user());

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

    public function update(Request $request, Member $member, UpdateMember $updateMember)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'pool' => ['required', 'in:big,small'],
            'status' => ['required', 'in:active,inactive'],
            'parent_name' => ['required', 'string', 'max:255'],
            'parent_email' => ['nullable', 'email'],
            'parent_phone' => ['required', 'string', 'max:20'],
        ]);

        $updateMember->handle($member, $validated, $request->user());

        return back()->with('success', 'Member updated!');
    }

    public function destroy(Member $member)
    {
        abort(403, 'Deleting members is not allowed.');
    }
}
