<?php

namespace App\Http\Controllers;

use App\Models\ClubNotification;
use App\Support\CurrentClub;
use App\Support\NotificationText;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // One list: every notification of this club, newest first (unread ones bold)
        return Inertia::render('notifications/index', [
            'items' => $user->notifications()->latest()->get()->map(fn ($notification) => [
                'id' => $notification->id,
                'message' => NotificationText::of($notification->data),
                'url' => $this->notificationUrl($notification, $user),
                'type' => $notification->data['type'] ?? '',
                'created_at' => $notification->created_at?->toDateTimeString(),
                'read_at' => $notification->read_at?->toDateTimeString(),
            ])->values(),
        ]);
    }

    /**
     * Marks one of the person's own notifications as read and opens its page. A
     * notification of their other club (a tapped push) switches to that club first.
     */
    public function markAsRead(Request $request, string $notification)
    {
        $user = $request->user();

        $notification = ClubNotification::withoutGlobalScope('club')
            ->whereKey($notification)
            ->where('notifiable_type', $user::class)
            ->where('notifiable_id', $user->id)
            ->first();

        abort_if($notification === null, 404);

        if ((int) $notification->club_id !== CurrentClub::id()) {
            abort_unless($user->memberships()->where('club_id', $notification->club_id)->whereNull('deactivated_at')->exists(), 404);

            $request->session()->put(CurrentClub::SESSION_KEY, (int) $notification->club_id);
            CurrentClub::forget();
        }

        if (! $notification->read_at) {
            $notification->markAsRead();
        }

        return redirect($this->notificationUrl($notification, $request->user()));
    }

    /**
     * The bell was opened and closed without choosing one: the notifications it
     * showed (only the person's own, in this club) are marked as read.
     */
    public function markSeen(Request $request)
    {
        $ids = $request->validate([
            'ids' => ['required', 'array', 'max:50'],
            'ids.*' => ['string', 'max:64'],
        ])['ids'];

        $request->user()->unreadNotifications()->whereKey($ids)->update(['read_at' => now()]);

        return back();
    }

    /** Deletes one of the person's own notifications (others' are not found). */
    public function destroy(Request $request, string $notification)
    {
        $found = $request->user()->notifications()->whereKey($notification)->first();

        abort_if($found === null, 404);

        $found->delete();

        return back();
    }

    /** Deletes all of the person's own notifications in this club. */
    public function destroyAll(Request $request)
    {
        $request->user()->notifications()->delete();

        return back();
    }

    private function notificationUrl(ClubNotification $notification, object $user): string
    {
        if (($notification->data['type'] ?? '') === 'salary_added' && $user->role === 'coach') {
            return '/dashboard?salary=1';
        }

        return $notification->data['url'] ?? '/dashboard';
    }
}
