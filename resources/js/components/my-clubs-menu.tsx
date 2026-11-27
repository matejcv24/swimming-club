import { router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { t } from '@/lib/i18n';

/** From MyClubs::for(): empty when the person has one club. */
export type MyClub = {
    id: number;
    name: string;
    logo_url: string | null;
    role: 'admin' | 'coach';
    current: boolean;
    unread: number;
};

export function useMyClubs(): MyClub[] {
    return (usePage().props.myClubs as MyClub[] | undefined) ?? [];
}

/** Unread notifications waiting in the person's other clubs (the avatar's red dot). */
export function useOtherClubsUnread(): number {
    return useMyClubs()
        .filter((club) => !club.current)
        .reduce((total, club) => total + club.unread, 0);
}

/**
 * "Мои клубови" at the top of the avatar menu: the person's clubs, the current
 * one ticked; one tap works in another. Only for people in two or more clubs.
 */
export function MyClubsMenu() {
    const clubs = useMyClubs();
    const getInitials = useInitials();

    if (clubs.length < 2) {
        return null;
    }

    return (
        <>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                {t('My clubs')}
            </DropdownMenuLabel>
            {clubs.map((club) => (
                <DropdownMenuItem
                    key={club.id}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 ${club.current ? 'bg-hydra-blue/10' : ''}`}
                    aria-current={club.current ? 'true' : undefined}
                    onSelect={() => {
                        if (!club.current) {
                            router.post(`/clubs/${club.id}/switch`);
                        }
                    }}
                >
                    {club.logo_url ? (
                        <img
                            src={club.logo_url}
                            alt=""
                            className="size-8 shrink-0 rounded-full object-cover"
                        />
                    ) : (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#001031] text-[11px] font-bold text-sky-200">
                            {getInitials(club.name)}
                        </span>
                    )}
                    <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                            {club.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                            {club.role === 'admin' ? t('Admin') : t('Coach')}
                        </span>
                    </span>
                    {club.current ? (
                        <Check className="size-4 text-hydra-blue" />
                    ) : (
                        club.unread > 0 && (
                            <span
                                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white"
                                aria-label={t(':count unread', {
                                    count: club.unread,
                                })}
                            >
                                {club.unread}
                            </span>
                        )
                    )}
                </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
        </>
    );
}

/** "Сега работите во …": a short message after switching clubs. */
export function ClubSwitchedToast() {
    const switched = usePage().props.clubSwitched as string | null | undefined;
    const [shown, setShown] = useState<string | null>(null);

    useEffect(() => {
        if (!switched) {
            return;
        }

        const show = setTimeout(() => setShown(switched), 0);
        const hide = setTimeout(() => setShown(null), 3500);

        return () => {
            clearTimeout(show);
            clearTimeout(hide);
        };
    }, [switched]);

    if (!shown) {
        return null;
    }

    return (
        <div
            role="status"
            className="fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 sm:bottom-8"
        >
            <div className="rounded-full bg-[#001031] px-5 py-3 text-[15px] font-semibold text-white shadow-lg dark:bg-white dark:text-[#001031]">
                {t('Now working in :club', { club: shown })}
            </div>
        </div>
    );
}
