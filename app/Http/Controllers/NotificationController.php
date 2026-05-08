<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('notifications/index', [
            'unreadNotifications' => $user->unreadNotifications()->latest()->get()->map(fn ($notification) => [
                'id' => $notification->id,
                'message' => $notification->data['message'] ?? '',
                'url' => $this->notificationUrl($notification, $user),
                'type' => $notification->data['type'] ?? '',
                'created_at' => $notification->created_at?->toDateTimeString(),
                'read_at' => $notification->read_at?->toDateTimeString(),
            ])->values(),
            'allNotifications' => $user->notifications()->latest()->get()->map(fn ($notification) => [
                'id' => $notification->id,
                'message' => $notification->data['message'] ?? '',
                'url' => $this->notificationUrl($notification, $user),
                'type' => $notification->data['type'] ?? '',
                'created_at' => $notification->created_at?->toDateTimeString(),
                'read_at' => $notification->read_at?->toDateTimeString(),
            ])->values(),
        ]);
    }

    public function markAsRead(Request $request, DatabaseNotification $notification)
    {
        abort_unless(
            (int) $notification->notifiable_id === $request->user()->id
                && $notification->notifiable_type === $request->user()::class,
            403
        );

        if (!$notification->read_at) {
            $notification->markAsRead();
        }

        return redirect($this->notificationUrl($notification, $request->user()));
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }

    private function notificationUrl(DatabaseNotification $notification, object $user): string
    {
        if (($notification->data['type'] ?? '') === 'salary_added' && $user->role === 'coach') {
            return '/dashboard?salary=1';
        }

        return $notification->data['url'] ?? '/dashboard';
    }
}
