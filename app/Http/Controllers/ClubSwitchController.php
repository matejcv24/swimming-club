<?php

namespace App\Http\Controllers;

use App\Models\Club;
use App\Support\CurrentClub;
use Illuminate\Http\Request;

/** "My clubs" in the avatar menu: work in another of the person's clubs. */
class ClubSwitchController extends Controller
{
    public function store(Request $request, Club $club)
    {
        // Only a club where this person is on the team and active (anything else: not found)
        abort_unless(
            $request->user()->memberships()->where('club_id', $club->id)->whereNull('deactivated_at')->exists(),
            404,
        );

        $request->session()->put(CurrentClub::SESSION_KEY, $club->id);
        CurrentClub::forget();

        return redirect('/dashboard')->with('club_switched', $club->name);
    }
}
