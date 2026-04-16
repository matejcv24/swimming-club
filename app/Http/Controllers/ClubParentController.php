<?php

namespace App\Http\Controllers;

use App\Models\ClubParent;
use Illuminate\Http\Request;

class ClubParentController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'unique:parents,email'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        ClubParent::create($validated);

        return back()->with('success', 'Parent added successfully!');
    }
}
