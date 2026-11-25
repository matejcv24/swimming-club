<?php

namespace App\Http\Controllers;

use App\Http\Middleware\SetLocale;
use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Turning push notifications on and off for the device the person is using. */
class PushSubscriptionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'url:https', 'max:2000'],
            'keys.p256dh' => ['required', 'string', 'max:255'],
            'keys.auth' => ['required', 'string', 'max:255'],
            'content_encoding' => ['nullable', Rule::in(['aes128gcm', 'aesgcm'])],
        ]);

        $locale = app()->getLocale();

        // The same device belongs to whoever turned it on last (a shared phone)
        PushSubscription::updateOrCreate(
            ['endpoint_hash' => PushSubscription::hash($validated['endpoint'])],
            [
                'user_id' => $request->user()->id,
                'endpoint' => $validated['endpoint'],
                'public_key' => $validated['keys']['p256dh'],
                'auth_token' => $validated['keys']['auth'],
                'content_encoding' => $validated['content_encoding'] ?? 'aes128gcm',
                'locale' => in_array($locale, SetLocale::LOCALES, true) ? $locale : SetLocale::DEFAULT,
            ],
        );

        return response()->noContent();
    }

    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'string', 'max:2000'],
        ]);

        PushSubscription::where('endpoint_hash', PushSubscription::hash($validated['endpoint']))
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->noContent();
    }
}
