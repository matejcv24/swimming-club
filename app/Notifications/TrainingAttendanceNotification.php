<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TrainingAttendanceNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $message,
        public string $url,
        // What happened, worded in the reader's language when shown (NotificationText)
        public array $text = [],
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'message' => $this->message,
            'text' => $this->text,
            'url' => $this->url,
            'type' => 'training_attendance',
        ];
    }
}
