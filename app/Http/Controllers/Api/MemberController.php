<?php

namespace App\Http\Controllers\Api;

use App\Actions\Members\CreateMember;
use App\Actions\Members\UpdateMember;
use App\Http\Controllers\Controller;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'members' => Member::with('parent')->get(),
        ]);
    }

    public function store(Request $request, CreateMember $createMember): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'pool' => ['required', 'in:big,small'],
            'parent_name' => ['required', 'string', 'max:255'],
            'parent_email' => ['nullable', 'sometimes', 'email', 'unique:parents,email'],
            'parent_phone' => ['required', 'string', 'max:20'],
        ]);

        $member = $createMember->handle($validated, $request->user());

        return response()->json([
            'message' => 'Member added successfully!',
            'member' => $member,
        ], 201);
    }

    public function update(Request $request, Member $member, UpdateMember $updateMember): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'pool' => ['required', 'in:big,small'],
            'status' => ['required', 'in:active,inactive'],
            'parent_name' => ['required', 'string', 'max:255'],
            'parent_email' => ['nullable', 'email'],
            'parent_phone' => ['required', 'string', 'max:20'],
        ]);

        $member = $updateMember->handle($member, $validated, $request->user());

        return response()->json([
            'message' => 'Member updated!',
            'member' => $member,
        ]);
    }
}
