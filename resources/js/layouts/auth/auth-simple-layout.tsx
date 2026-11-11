import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        // Club navy, the same color as the logo's background and the app icon.
        // "light" keeps these pages in light colors even when dark mode is on.
        <div className="light flex min-h-svh flex-col items-center justify-center bg-hydra-navy px-4 py-10">
            <div className="flex w-full max-w-sm flex-col items-center gap-6">
                <img
                    src="/images/hydra-logo.webp"
                    alt="Hydra Swimming Club"
                    width={362}
                    height={400}
                    className="h-40 w-auto select-none sm:h-48"
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
