<?php

namespace App\Http\Controllers;

class MemberController extends Controller
{
    public function index()
    {
        return inertia('members/index');
    }
}
