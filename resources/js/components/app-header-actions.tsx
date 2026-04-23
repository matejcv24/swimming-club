import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationsMenu } from '@/components/notifications-menu';
import { useInitials } from '@/hooks/use-initials';

function EnglishLanguageIndicator() {
    return (
        <div className="flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium">
            <span
                className="relative h-4 w-6 overflow-hidden rounded-[2px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
                aria-hidden="true"
            >
                <span className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 bg-red-600" />
                <span className="absolute top-0 left-1/2 h-full w-1 -translate-x-1/2 bg-red-600" />
            </span>
            <span>EN</span>
        </div>
    );
}

export function AppHeaderActions() {
    const { auth } = usePage().props;
    const getInitials = useInitials();

    const handleLogout = () => {
        router.flushAll();
    };

    if (!auth.user) {
        return <EnglishLanguageIndicator />;
    }

    return (
        <div className="ml-auto flex max-w-full shrink-0 items-center gap-1">
            <EnglishLanguageIndicator />
            <NotificationsMenu />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex size-9 items-center justify-center rounded-md transition hover:bg-sidebar-accent"
                        aria-label="User menu"
                    >
                        <Avatar className="size-8">
                            <AvatarImage
                                src={auth.user.avatar}
                                alt={auth.user.name}
                            />
                            <AvatarFallback className="bg-neutral-200 text-xs text-black dark:bg-neutral-700 dark:text-white">
                                {getInitials(auth.user.name)}
                            </AvatarFallback>
                        </Avatar>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                        <Link
                            href="/settings/security"
                            className="flex w-full cursor-pointer items-center"
                        >
                            <Settings className="mr-2 size-4" />
                            Settings
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex w-full cursor-pointer items-center"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 size-4" />
                            Log out
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
