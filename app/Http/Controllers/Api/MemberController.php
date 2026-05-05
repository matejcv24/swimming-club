<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClubParent;
use App\Models\Member;
use App\Models\User;
use App\Notifications\MemberChangedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MemberController extends Controller
{
    public function store(Request $request): JsonResponse
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

        return response()->json([
            'message' => 'Member added successfully!',
            'member' => $member->load('parent'),
        ], 201);
    }
}
