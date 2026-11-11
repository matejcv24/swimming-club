import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { NotificationsMenu } from '@/components/notifications-menu';
import { forgetThemeUser, ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function AppHeaderActions() {
    const { auth } = usePage().props as {
        auth?: { user?: User | null };
    };
    const getInitials = useInitials();

    const handleLogout = () => {
        forgetThemeUser();
        router.flushAll();
    };

    if (!auth?.user) {
        return <ThemeToggle />;
    }

    return (
        <div className="ml-auto flex max-w-full shrink-0 items-center gap-1">
            <ThemeToggle />
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
                            <AvatarFallback className="bg-hydra-blue text-xs font-bold text-white">
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
