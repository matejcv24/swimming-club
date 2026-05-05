<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class StaffController extends Controller
{
    public function index()
    {
        return inertia('staff/index');
    }

    public function showClaimForm(Request $request, User $coach)
    {
        if ($coach->role !== 'coach') {
            abort(403);
        }

        return Inertia::render('auth/claim-coach-account', [
            'coachName' => $coach->name,
            'coachEmail' => $coach->email,
            'coachId' => $coach->id,
            'claimUrl' => URL::temporarySignedRoute(
                'api.claim-coach-account.store',
                Carbon::createFromTimestamp((int) $request->query('expires')),
                ['coach' => $coach->id]
            ),
        ]);
    }
}
