<?php

namespace App\Http\Controllers;

class TrainingController extends Controller
{
    public function index()
    {
        return inertia('trainings/index');
    }
}
