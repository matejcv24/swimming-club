<?php

namespace App\Notifications\Concerns;

use App\Notifications\Channels\WebPushChannel;
use App\Support\NotificationText;

/**
 * A notification that shows in the bell and also arrives as a push on the
 * person's devices, with the same sentence and the same page to open.
 */
trait SendsPush
{
    public function via(object $notifiable): array
    {
        // An admin who turned this kind off gets neither the bell nor a push
        if (method_exists($notifiable, 'wantsNotification')
            && ! $notifiable->wantsNotification($this->toArray($notifiable)['type'])) {
            return [];
        }

        return ['database', WebPushChannel::class];
    }

    /** @return array{body: string, url: string} */
    public function toPush(object $notifiable): array
    {
        $data = $this->toArray($notifiable);

        return [
            'body' => NotificationText::of($data),
            // Same as tapping it in the bell: marked as read, then its page
            'url' => $this->id ? '/notifications/'.$this->id.'/open' : $data['url'],
        ];
    }
}
