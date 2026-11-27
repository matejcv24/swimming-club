import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { DeviceMenuItems } from '@/components/device-menu-items';
import {
    InstallAppDialog,
    PushOffer,
    stopInstallReminders,
    useInstallReminder,
} from '@/components/install-app-dialog';
import { LanguageSwitch } from '@/components/language-switch';
import {
    ClubSwitchedToast,
    MyClubsMenu,
    useOtherClubsUnread,
} from '@/components/my-clubs-menu';
import { NotificationsMenu } from '@/components/notifications-menu';
import { PhoneMenuSettings } from '@/components/phone-menu-settings';
import { QuickActionsTopBar } from '@/components/quick-actions';
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
import { turnPushOff } from '@/lib/device';
import { t } from '@/lib/i18n';
import type { User } from '@/types';

export function AppHeaderActions() {
    const { auth } = usePage().props as {
        auth?: { user?: User | null };
    };
    const getInitials = useInitials();
    // Unread notifications in the person's other clubs: a red dot on the avatar
    const otherClubsUnread = useOtherClubsUnread();
    const [installOpen, setInstallOpen] = useState(false);
    // On a phone, after the first login: "Add to home screen" by itself
    const installDue = useInstallReminder(Boolean(auth?.user));
    const [reminderClosed, setReminderClosed] = useState(false);
    const showInstall = installOpen || (installDue && !reminderClosed);

    const closeInstall = () => {
        setInstallOpen(false);
        setReminderClosed(true);
    };

    const handleLogout = () => {
        forgetThemeUser();
        // A logged-out device gets no more pushes for this person
        turnPushOff().catch(() => {});
        router.flushAll();
    };

    if (!auth?.user) {
        return (
            <div className="ml-auto flex items-center gap-1">
                <LanguageSwitch />
                <ThemeToggle />
            </div>
        );
    }

    return (
        <div className="ml-auto flex max-w-full shrink-0 items-center gap-1">
            <QuickActionsTopBar />
            {/* Phones: these two are in the avatar menu (kept mounted for the theme sync) */}
            <div className="hidden items-center gap-1 sm:flex">
                <LanguageSwitch />
                <ThemeToggle />
            </div>
            <NotificationsMenu />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="relative flex size-9 cursor-pointer items-center justify-center rounded-full transition hover:bg-hydra-blue/15 data-[state=open]:bg-hydra-blue/15"
                        aria-label={
                            otherClubsUnread > 0
                                ? t('User menu, unread in other clubs')
                                : t('User menu')
                        }
                    >
                        {otherClubsUnread > 0 && (
                            <span className="absolute top-0 right-0 z-10 size-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                        )}
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
                <DropdownMenuContent
                    align="end"
                    className="w-64"
                    onCloseAutoFocus={(event) => event.preventDefault()}
                >
                    <MyClubsMenu />
                    <DeviceMenuItems onInstall={() => setInstallOpen(true)} />
                    <PhoneMenuSettings />
                    <DropdownMenuItem asChild>
                        <Link
                            href="/settings/profile"
                            className="flex w-full cursor-pointer items-center"
                        >
                            <Settings className="mr-2 size-4" />
                            {t('Account settings')}
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
                            {t('Log out')}
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Drawn only while open, so it starts fresh each time */}
            {showInstall && (
                <InstallAppDialog
                    open
                    onClose={closeInstall}
                    onDone={() => {
                        stopInstallReminders();
                        closeInstall();
                    }}
                />
            )}
            <PushOffer />
            <ClubSwitchedToast />
        </div>
    );
}
