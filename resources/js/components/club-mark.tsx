/** Up to two capital letters from the club's name, for a club without a logo. */
function initialsOf(name: string): string {
    return (
        name
            .trim()
            .split(/\s+/)
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?'
    );
}

/**
 * The club's round mark: its logo, or its initials on navy when it has none
 * (or nothing at all with `initials={false}`). Sized by `className` (e.g. "size-8").
 */
export function ClubMark({
    name,
    logoUrl,
    initials = true,
    className = 'size-8 text-xs',
}: {
    name: string;
    logoUrl: string | null;
    initials?: boolean;
    className?: string;
}) {
    const ring =
        'shadow-[0_0_0_1px_#dbe7f0] dark:shadow-[0_0_0_1px_rgb(186_230_253/0.14)]';

    if (logoUrl) {
        return (
            <img
                src={logoUrl}
                alt=""
                className={`flex-none rounded-full bg-hydra-navy object-cover ${ring} ${className}`}
            />
        );
    }

    if (!initials) {
        return null;
    }

    return (
        <span
            aria-hidden="true"
            className={`flex flex-none items-center justify-center rounded-full bg-hydra-navy font-bold text-white ${ring} ${className}`}
        >
            {initialsOf(name)}
        </span>
    );
}
