<?php

namespace App\Notifications\Channels;

use App\Models\Club;
use App\Models\PushSubscription;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\HttpFactory;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\App;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Throwable;

/**
 * Sends a notification as a push to every device where the person turned push
 * on, worded in each device's language. Without the keys in .env it does
 * nothing; a failed push never stops what the person was doing.
 */
class WebPushChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (! self::configured() || ! method_exists($notification, 'toPush') || ! method_exists($notifiable, 'pushSubscriptions')) {
            return;
        }

        $subscriptions = $notifiable->pushSubscriptions()->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        try {
            $factory = new HttpFactory;
            $webPush = new WebPush(
                ['VAPID' => [
                    'subject' => config('services.webpush.subject'),
                    'publicKey' => config('services.webpush.public_key'),
                    'privateKey' => config('services.webpush.private_key'),
                ]],
                ['TTL' => 60 * 60 * 24, 'urgency' => 'normal'],
                new Client(['timeout' => 5, 'connect_timeout' => 3]),
                $factory,
                $factory,
            );

            $title = Club::current()->name;

            foreach ($subscriptions as $subscription) {
                $push = App::withLocale($subscription->locale, fn () => $notification->toPush($notifiable));

                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $subscription->endpoint,
                        'publicKey' => $subscription->public_key,
                        'authToken' => $subscription->auth_token,
                        'contentEncoding' => $subscription->content_encoding,
                    ]),
                    json_encode([
                        'title' => $title,
                        'body' => $push['body'],
                        'url' => $push['url'],
                    ], JSON_UNESCAPED_UNICODE),
                );
            }

            foreach ($webPush->flush() as $report) {
                // The device turned push off or the browser was removed: forget it
                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint_hash', PushSubscription::hash($report->getEndpoint()))->delete();
                }
            }
        } catch (Throwable $e) {
            report($e);
        }
    }

    public static function configured(): bool
    {
        return filled(config('services.webpush.public_key')) && filled(config('services.webpush.private_key'));
    }
}
