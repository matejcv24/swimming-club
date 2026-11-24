/**
 * The app's own mark (Huddle): four dots in a huddle, in the brand colors. Shown
 * where a club has no logo yet. On a dark background the navy dot turns white,
 * so it doesn't disappear.
 */
export function HuddleMark({
    onDark = false,
    className = 'size-16',
}: {
    onDark?: boolean;
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            role="img"
            aria-label="Huddle"
            className={className}
        >
            <circle cx="50" cy="27" r="17" fill="#1690c8" />
            <circle
                cx="73"
                cy="50"
                r="17"
                fill={onDark ? '#ffffff' : '#001031'}
            />
            <circle cx="50" cy="73" r="17" fill="#c5dceb" />
            <circle cx="27" cy="50" r="17" fill="#f59e0b" />
        </svg>
    );
}
