<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $coach = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'coach',
        ]);

        $coach->forceFill(['email_verified_at' => now()])->save();

        return back()->with('success', 'Coach created successfully!');
    }

    public function update(Request $request, User $coach)
    {
        abort_unless($coach->role === 'coach', 404);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', Rule::unique('users', 'email')->ignore($coach->id)],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $coach->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if (!empty($validated['password'])) {
            $coach->password = $validated['password'];
            $coach->setRememberToken(Str::random(60));

            // Log the coach out everywhere so the old password stops working immediately
            if (config('session.driver') === 'database') {
                DB::table(config('session.table', 'sessions'))->where('user_id', $coach->id)->delete();
            }
        }

        $coach->save();

        return back()->with('success', 'Coach updated successfully!');
    }
}
