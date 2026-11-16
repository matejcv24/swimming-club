<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The app's language: Macedonian unless this browser chose English with the
 * MK / EN switch in the header (kept in the "locale" cookie).
 */
class SetLocale
{
    public const LOCALES = ['mk', 'en'];

    public const DEFAULT = 'mk';

    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->cookie('locale');

        app()->setLocale(in_array($locale, self::LOCALES, true) ? $locale : self::DEFAULT);

        return $next($request);
    }
}
