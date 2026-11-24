import { usePage } from '@inertiajs/react';
import { HuddleMark } from '@/components/huddle-mark';
import { LanguageSwitch } from '@/components/language-switch';
import type { AuthLayoutProps } from '@/types';
import type { ClubSharedData } from '@/types/club';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { club } = usePage().props as { club?: ClubSharedData | null };

    return (
        // Club navy, the same color as the logo's background and the app icon.
        // "light" keeps these pages in light colors even when dark mode is on.
        // Pinned to the screen: the page never scrolls or bounces, and the logo
        // shrinks on short screens so everything fits.
        <div className="light fixed inset-0 flex flex-col items-center justify-center overflow-hidden overscroll-none bg-hydra-navy px-4 py-4">
            {/* MK / EN, so the language can be chosen before logging in */}
            <div className="absolute top-3 right-3 text-white">
                <LanguageSwitch />
            </div>

            <div className="flex w-full max-w-sm flex-col items-center gap-[min(1.5rem,3svh)]">
                {/* The club's logo and name; without a logo, the app's own mark */}
                <div className="flex flex-col items-center gap-[min(0.75rem,1.5svh)] select-none">
                    {club?.logo_url ? (
                        <img
                            src={club.logo_url}
                            alt=""
                            className="size-[min(7rem,15svh)] rounded-full bg-white/5 object-cover shadow-[0_0_0_3px_rgb(255_255_255/0.18)] sm:size-[min(8rem,17svh)]"
                            draggable={false}
                        />
                    ) : (
                        <HuddleMark
                            onDark
                            className="size-[min(7rem,15svh)] sm:size-[min(8rem,17svh)]"
                        />
                    )}
                    <p className="text-center text-xl font-bold tracking-wide text-white">
                        {club?.name ?? 'Huddle'}
                    </p>
                </div>

                {/* White card with the logo's blue for text, links, checkbox and buttons */}
                <div className="w-full rounded-2xl bg-white p-6 text-hydra-blue shadow-2xl shadow-black/40 [--foreground:var(--color-hydra-blue)] [--input:#c5dceb] [--primary-foreground:#fff] [--primary:var(--color-hydra-blue)] [--ring:var(--color-hydra-blue)] sm:p-8 [&_input]:text-hydra-navy">
                    <div className="mb-6 space-y-1.5 text-center">
                        <h1 className="text-xl font-semibold">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
