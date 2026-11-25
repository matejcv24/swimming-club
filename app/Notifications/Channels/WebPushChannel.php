<?php

namespace App\Notifications\Channels;

use App\Models\Club;
use App\Models\PushSubscription;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\HttpFactory;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
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
            self::log('info', 'No devices with push on', ['user' => $notifiable->getKey()]);

            return;
        }

        try {
            $results = self::deliver($subscriptions, fn (PushSubscription $subscription) => App::withLocale(
                $subscription->locale,
                fn () => $notification->toPush($notifiable),
            ), self::unreadCount($notifiable));

            self::log('info', 'Push sent', [
                'user' => $notifiable->getKey(),
                'devices' => count($results),
                'delivered' => collect($results)->where('sent', true)->count(),
            ]);
        } catch (Throwable $e) {
            self::log('error', 'Push failed: '.$e::class.': '.$e->getMessage());
            report($e);
        }
    }

    /** One short line in storage/logs/push-*.log (never stops anything). */
    public static function log(string $level, string $message, array $context = []): void
    {
        try {
            Log::channel('push')->log($level, $message, $context);
        } catch (Throwable) {
            // Logging must never break sending
        }
    }

    /**
     * Sends one push to each device; the badge is the number on the app's icon.
     * Returns, per device, whether it went through and why not.
     *
     * @param  Collection<int, PushSubscription>  $subscriptions
     * @param  callable(PushSubscription): array{body: string, url: string}  $message
     * @return array<int, array{sent: bool, reason: string}>
     */
    public static function deliver(Collection $subscriptions, callable $message, int $badge): array
    {
        $factory = new HttpFactory;
        $webPush = new WebPush(
            ['VAPID' => [
                'subject' => config('services.webpush.subject'),
                'publicKey' => config('services.webpush.public_key'),
                'privateKey' => config('services.webpush.private_key'),
            ]],
            ['TTL' => 60 * 60 * 24, 'urgency' => 'high'],
            new Client(['timeout' => 5, 'connect_timeout' => 3]),
            $factory,
            $factory,
        );

        $title = Club::current()->name;

        foreach ($subscriptions as $subscription) {
            $push = $message($subscription);

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
                    'badge' => $badge,
                ], JSON_UNESCAPED_UNICODE),
            );
        }

        $results = [];

        foreach ($webPush->flush() as $report) {
            // The device turned push off or the browser was removed: forget it
            if ($report->isSubscriptionExpired()) {
                PushSubscription::where('endpoint_hash', PushSubscription::hash($report->getEndpoint()))->delete();
            }

            if (! $report->isSuccess()) {
                self::log('warning', 'Push not delivered', [
                    'service' => parse_url($report->getEndpoint(), PHP_URL_HOST),
                    'reason' => $report->getReason(),
                ]);
            }

            $results[] = ['sent' => $report->isSuccess(), 'reason' => $report->isSuccess() ? '' : $report->getReason()];
        }

        return $results;
    }

    /** The person's unread notifications (the new one included): the icon's number. */
    private static function unreadCount(object $notifiable): int
    {
        return method_exists($notifiable, 'unreadNotifications') ? $notifiable->unreadNotifications()->count() : 0;
    }

    public static function configured(): bool
    {
        return filled(config('services.webpush.public_key')) && filled(config('services.webpush.private_key'));
    }
}
