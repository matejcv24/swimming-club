import { LanguageSwitch } from '@/components/language-switch';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
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
                <img
                    src="/images/hydra-logo.webp"
                    alt="Hydra Swimming Club"
                    width={362}
                    height={400}
                    className="h-[min(10rem,22svh)] w-auto select-none sm:h-[min(12rem,24svh)]"
                    draggable={false}
                />

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
