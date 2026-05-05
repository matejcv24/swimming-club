<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('notifications/index');
    }

    public function markAsRead(Request $request, DatabaseNotification $notification)
    {
        abort_unless(
            (int) $notification->notifiable_id === $request->user()->id
                && $notification->notifiable_type === $request->user()::class,
            403
        );

        if (! $notification->read_at) {
            $notification->markAsRead();
        }

        return redirect($notification->data['url'] ?? '/dashboard');
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }
}
