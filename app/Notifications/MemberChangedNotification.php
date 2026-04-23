<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MemberChangedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $message,
        public string $url,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'message' => $this->message,
            'url' => $this->url,
            'type' => 'member_changed',
        ];
    }
}