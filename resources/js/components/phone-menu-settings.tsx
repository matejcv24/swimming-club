import { Languages, Moon } from 'lucide-react';
import type { ReactNode } from 'react';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { changeLocale, locale, t } from '@/lib/i18n';

/** Two choices side by side, the chosen one filled. */
function Choice<T extends string>({
    value,
    options,
    onChange,
    label,
}: {
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
    label: string;
}) {
    return (
        <div
            role="radiogroup"
            aria-label={label}
            className="ml-auto flex flex-none rounded-full bg-muted p-0.5"
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={option.value === value}
                    onClick={() =>
                        option.value !== value && onChange(option.value)
                    }
                    className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                        option.value === value
                            ? 'bg-hydra-blue text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function Row({
    icon,
    label,
    children,
}: {
    icon: ReactNode;
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
            {icon}
            <span>{label}</span>
            {children}
        </div>
    );
}

/**
 * On phones the top bar has no room for the language and light / dark
 * switches, so they're in the avatar menu instead (computers keep them on top).
 */
export function PhoneMenuSettings() {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <div className="sm:hidden">
            <Row
                icon={<Languages className="size-4 text-muted-foreground" />}
                label={t('Language')}
            >
                <Choice
                    label={t('Language')}
                    value={locale}
                    options={[
                        { value: 'mk', label: 'MK' },
                        { value: 'en', label: 'EN' },
                    ]}
                    onChange={changeLocale}
                />
            </Row>
            <Row
                icon={<Moon className="size-4 text-muted-foreground" />}
                label={t('Appearance')}
            >
                <Choice
                    label={t('Appearance')}
                    value={resolvedAppearance === 'dark' ? 'dark' : 'light'}
                    options={[
                        { value: 'light', label: t('Light') },
                        { value: 'dark', label: t('Dark') },
                    ]}
                    onChange={updateAppearance}
                />
            </Row>
            <DropdownMenuSeparator />
        </div>
    );
}
