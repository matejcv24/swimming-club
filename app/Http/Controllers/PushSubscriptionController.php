<?php

namespace App\Http\Controllers;

use App\Http\Middleware\SetLocale;
use App\Models\PushSubscription;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

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

    /**
     * A test push to this device only, so the person sees it works (or why
     * not: the answer says what the push service replied).
     */
    public function test(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'string', 'max:2000'],
        ]);

        $subscription = PushSubscription::where('endpoint_hash', PushSubscription::hash($validated['endpoint']))
            ->where('user_id', $request->user()->id)
            ->get();

        if (! WebPushChannel::configured()) {
            return response()->json(['sent' => false, 'reason' => 'Push is not set up on the server.']);
        }

        if ($subscription->isEmpty()) {
            return response()->json(['sent' => false, 'reason' => 'This device is not registered. Turn notifications off and on again.']);
        }

        try {
            $result = WebPushChannel::deliver(
                $subscription,
                fn () => ['body' => __('Notifications work on this device.'), 'url' => '/dashboard'],
                $request->user()->unreadNotifications()->count(),
            )[0] ?? ['sent' => false, 'reason' => 'No answer from the push service.'];
        } catch (Throwable $e) {
            WebPushChannel::log('error', 'Test push failed: '.$e::class.': '.$e->getMessage());
            report($e);
            $result = ['sent' => false, 'reason' => class_basename($e).': '.$e->getMessage()];
        }

        return response()->json($result);
    }
}
