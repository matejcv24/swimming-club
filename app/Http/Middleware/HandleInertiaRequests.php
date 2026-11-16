<?php

namespace App\Http\Middleware;

use App\Models\Group;
use App\Support\DashboardSummary;
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
            'auth' => [
                'user' => $request->user(),
            ],
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
                        'members_count' => $group->members_count,
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
                        'message' => $notification->data['message'] ?? '',
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
}
