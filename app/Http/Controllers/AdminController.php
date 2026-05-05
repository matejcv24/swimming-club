<?php

namespace App\Http\Controllers;

class AdminController extends Controller
{
    public function index()
    {
        return inertia('dashboard');
    }

    public function invoices()
    {
        return inertia('invoices/index');
    }
}
