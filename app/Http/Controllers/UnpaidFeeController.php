<?php

namespace App\Http\Controllers;

class UnpaidFeeController extends Controller
{
    public function index()
    {
        return inertia('unpaid-fees/index');
    }
}
