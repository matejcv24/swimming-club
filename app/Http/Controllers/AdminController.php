<?php

namespace App\Http\Controllers;

use App\Models\Member;

class AdminController extends Controller
{
    public function index()
    {
        return inertia('dashboard', [
            'totalMembers' => Member::count(),
            'totalTrainings' => 0,
            'unpaidFees' => 0,
        ]);
    }
}
