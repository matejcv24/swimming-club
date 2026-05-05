<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index()
    {
        return Inertia::render('attendance/index');
    }
}
