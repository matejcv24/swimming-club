<?php

namespace App\Http\Middleware;

use App\Support\ClubAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A club whose subscription ended (after the grace days) is read-only: its pages
 * open as usual, but nothing can be added, changed or deleted. Signing out, the
 * person's own account and device, and the bell still work.
 */
class EnsureClubCanWrite
{
    /** What still works while read-only (none of it is club data). */
    private const ALLOWED = [
        'logout', 'settings/*', 'user/*', 'push-subscriptions', 'push-subscriptions/*',
        'notifications', 'notifications/*', 'two-factor-challenge', 'email/*', 'clubs/*/switch',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethodSafe() || ! $request->user() || $request->is(...self::ALLOWED)) {
            return $next($request);
        }

        if (ClubAccess::current()->canWrite()) {
            return $next($request);
        }

        $message = __('The subscription has ended: the app is read-only. Nothing was deleted.');

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['message' => $message], 423);
        }

        return back()->withErrors(['club' => $message]);
    }
}
