<?php

namespace App\Http\Controllers;

class ProfitController extends Controller
{
    public function index()
    {
        return inertia('profit/index');
    }
}
