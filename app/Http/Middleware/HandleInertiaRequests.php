<?php

namespace App\Http\Middleware;

use App\Models\Group;
use App\Models\Member;
use App\Notifications\Channels\WebPushChannel;
use App\Support\ClubAccess;
use App\Support\CurrentClub;
use App\Support\DashboardSummary;
use App\Support\MyClubs;
use App\Support\NotificationText;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Routes whose page is a pop-up shown on top of the dashboard.
     */
    private const POPUP_PAGES = [
        'members.index',
        'trainings.index',
        'membership-fees.index',
        'attendance.index',
        'unpaid-fees.index',
        'staff.index',
        'invoices.page',
        'profit.index',
        'notifications.index',
        'groups.index',
    ];

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            // The app's language (mk / en), so the pages are drawn in it everywhere
            'locale' => app()->getLocale(),
            'auth' => [
                'user' => $request->user(),
            ],
            // The key a device needs to turn on push notifications (none: push is off)
            'pushKey' => fn () => $request->user() && WebPushChannel::configured()
                ? config('services.webpush.public_key')
                : null,
            // The club's name and logo (top bar, and the login and invitation pages);
            // its email only for people logged in
            'club' => function () use ($request) {
                $club = CurrentClub::get();

                // An address of no club (the shared sign-in page later): the app's own name
                if (! $club) {
                    return [
                        'name' => config('app.name'),
                        'email' => null,
                        'logo_url' => null,
                        'payment_confirmation_emails' => false,
                        'payment_reminder_emails' => false,
                        'auto_payment_confirmation' => false,
                        'auto_payment_reminder' => false,
                    ];
                }

                return [
                    'name' => $club->name,
                    'email' => $request->user() ? $club->email : null,
                    'logo_url' => $club->logoUrl(),
                    // Whether the club sends these emails (Club settings)
                    'payment_confirmation_emails' => (bool) $club->payment_confirmation_emails,
                    'payment_reminder_emails' => (bool) $club->payment_reminder_emails,
                    // ...and whether they go out by themselves
                    'auto_payment_confirmation' => (bool) $club->auto_payment_confirmation,
                    'auto_payment_reminder' => (bool) $club->auto_payment_reminder,
                ];
            },
            // "My clubs" in the avatar menu (empty: the person has one club)
            'myClubs' => fn () => $request->user() ? MyClubs::for($request->user()) : [],
            // The club just switched to, for the short message after switching
            'clubSwitched' => fn () => $request->session()->get('club_switched'),
            // The payment just recorded, for the "payment saved / send confirmation" pop-up
            'feeSaved' => fn () => $request->session()->get('fee_saved'),
            // The subscription banner (demo ending, grace, read-only); null: none
            'clubAccess' => fn () => $request->user() ? ClubAccess::current()->banner() : null,
            // The club's groups (in their order) and their subgroups, with how many
            // members each has
            'groups' => fn () => $request->user()
                ? Group::ordered()
                    // Coaches only see the groups they are assigned to
                    ->when(
                        $request->user()->visibleGroupIds() !== null,
                        fn ($query) => $query->whereIn('id', $request->user()->visibleGroupIds()),
                    )
                    ->withCount('members')
                    ->with(['subgroups' => fn ($query) => $query->withCount('subgroupMembers as members_count')])
                    ->get(['id', 'name'])
                    ->map(fn (Group $group) => [
                        'id' => $group->id,
                        'name' => $group->name,
                        'members_count' => $group->members_count + $this->allGroupsMemberCount(),
                        'subgroups' => $group->subgroups->map(fn (Group $subgroup) => [
                            'id' => $subgroup->id,
                            'name' => $subgroup->name,
                            'members_count' => $subgroup->members_count,
                        ])->values(),
                    ])
                : [],
            // Dashboard card numbers for the pages that open as a pop-up over the dashboard
            'dashboardSummary' => fn () => $request->user() && $request->routeIs(self::POPUP_PAGES)
                ? DashboardSummary::for($request->user())
                : null,
            // Lazy, so partial reloads (e.g. a list refreshing itself) skip these queries
            'notifications' => fn () => $request->user()
                ? [
                    'unread_count' => $request->user()->unreadNotifications()->count(),
                    'unread' => $request->user()->unreadNotifications()->latest()->take(5)->get()->map(fn ($notification) => [
                        'id' => $notification->id,
                        'message' => NotificationText::of($notification->data),
                        'url' => $this->notificationUrl($notification, $request->user()),
                        'type' => $notification->data['type'] ?? '',
                        'created_at' => $notification->created_at?->toDateTimeString(),
                        'read_at' => $notification->read_at?->toDateTimeString(),
                    ])->values(),
                ]
                : [
                    'unread_count' => 0,
                    'unread' => [],
                ],
        ];
    }

    private function notificationUrl(object $notification, object $user): string
    {
        if (($notification->data['type'] ?? '') === 'salary_added' && $user->role === 'coach') {
            return '/dashboard?salary=1';
        }

        return $notification->data['url'] ?? '/dashboard';
    }

    private ?int $allGroupsMemberCount = null;

    /** Members of all groups (no single group): part of every group's count. */
    private function allGroupsMemberCount(): int
    {
        return $this->allGroupsMemberCount ??= Member::whereNull('group_id')->count();
    }
}
