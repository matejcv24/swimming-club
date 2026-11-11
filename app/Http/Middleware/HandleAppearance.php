<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    private const APPEARANCES = ['light', 'dark', 'system'];

    /**
     * Theme for the first paint: the logged-in user's saved choice, otherwise
     * this browser's last choice, otherwise dark.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $appearance = $request->user()?->appearance ?? $request->cookie('appearance');

        View::share('appearance', in_array($appearance, self::APPEARANCES, true) ? $appearance : 'dark');

        return $next($request);
    }
}
