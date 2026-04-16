<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Training;

class AdminController extends Controller
{
    public function index()
    {
        return inertia('dashboard', [
            'totalMembers' => Member::count(),
            'totalTrainings' => Training::count(),
            'unpaidFees' => 0,
        ]);
    }
}
