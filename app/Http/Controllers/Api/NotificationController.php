<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'unreadNotifications' => $user->unreadNotifications()->latest()->get()->map(fn ($notification) => $this->serializeNotification($notification))->values(),
            'allNotifications' => $user->notifications()->latest()->get()->map(fn ($notification) => $this->serializeNotification($notification))->values(),
        ]);
    }

    public function markAsRead(Request $request, DatabaseNotification $notification): JsonResponse
    {
        abort_unless(
            (int) $notification->notifiable_id === $request->user()->id
                && $notification->notifiable_type === $request->user()::class,
            403
        );

        if (! $notification->read_at) {
            $notification->markAsRead();
        }

        return response()->json([
            'url' => $notification->data['url'] ?? '/dashboard',
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'unreadNotifications' => [],
            'allNotifications' => $request->user()->notifications()->latest()->get()->map(fn ($notification) => $this->serializeNotification($notification))->values(),
        ]);
    }

    private function serializeNotification(DatabaseNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'message' => $notification->data['message'] ?? '',
            'url' => $notification->data['url'] ?? '/dashboard',
            'type' => $notification->data['type'] ?? '',
            'created_at' => $notification->created_at?->toDateTimeString(),
            'read_at' => $notification->read_at?->toDateTimeString(),
        ];
    }
}
