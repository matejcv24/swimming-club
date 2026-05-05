<?php

namespace App\Http\Controllers;

class MembershipFeeController extends Controller
{
    public function index()
    {
        return inertia('membership-fees/index');
    }
}
