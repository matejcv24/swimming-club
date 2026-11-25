<?php

namespace App\Notifications;

use App\Notifications\Concerns\SendsPush;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MemberChangedNotification extends Notification
{
    use Queueable;
    use SendsPush;

    public function __construct(
        public string $message,
        public string $url,
        // What happened, worded in the reader's language when shown (NotificationText)
        public array $text = [],
    ) {}

    public function toArray(object $notifiable): array
    {
        return [
            'message' => $this->message,
            'text' => $this->text,
            'url' => $this->url,
            'type' => 'member_changed',
        ];
    }
}
