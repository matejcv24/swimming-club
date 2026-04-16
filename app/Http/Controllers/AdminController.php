<?php

namespace App\Http\Controllers;

class AdminController extends Controller
{
    public function index()
    {
        return inertia('dashboard', [
            'totalMembers' => 0,
            'totalTrainings' => 0,
            'unpaidFees' => 0,
        ]);
    }
}
