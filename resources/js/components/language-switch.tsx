import { Check } from 'lucide-react';
import { useId } from 'react';
import { Hint } from '@/components/popup-ui';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { changeLocale, locale, t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

/** North Macedonia: a yellow sun with eight rays on red. */
function MkFlag({ className = '' }: { className?: string }) {
    const rays = [0, 45, 90, 135, 180, 225, 270, 315];

    return (
        <svg
            viewBox="-14 -7 28 14"
            className={className}
            aria-hidden
            preserveAspectRatio="xMidYMid slice"
        >
            <rect x="-14" y="-7" width="28" height="14" fill="#d20000" />
            <g fill="#ffe600">
                {rays.map((angle) => (
                    <path
                        key={angle}
                        d="M0,0 L16,-1.4 L16,1.4 Z"
                        transform={`rotate(${angle})`}
                    />
                ))}
            </g>
            <circle r="3.1" fill="#d20000" />
            <circle r="2.5" fill="#ffe600" />
        </svg>
    );
}

/** United Kingdom (English). */
function EnFlag({ className = '' }: { className?: string }) {
    const id = useId();

    return (
        <svg
            viewBox="0 0 60 30"
            className={className}
            aria-hidden
            preserveAspectRatio="xMidYMid slice"
        >
            <clipPath id={`${id}-cross`}>
                <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
            </clipPath>
            <rect width="60" height="30" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path
                d="M0,0 L60,30 M60,0 L0,30"
                clipPath={`url(#${id}-cross)`}
                stroke="#C8102E"
                strokeWidth="4"
            />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
        </svg>
    );
}

const LANGUAGES: { code: Locale; name: string; Flag: typeof MkFlag }[] = [
    { code: 'mk', name: 'Македонски', Flag: MkFlag },
    { code: 'en', name: 'English', Flag: EnFlag },
];

const flagClass = 'h-[14px] w-[21px] flex-none rounded-[3px] shadow-sm';

/** The MK / EN language menu in the header, next to the light / dark switch. */
export function LanguageSwitch() {
    const current =
        LANGUAGES.find((language) => language.code === locale) ?? LANGUAGES[0];

    return (
        <DropdownMenu>
            <Hint title={t('Change language')}>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-bold transition hover:bg-hydra-blue/15 hover:text-hydra-blue data-[state=open]:bg-hydra-blue/15 data-[state=open]:text-hydra-blue"
                        aria-label={t('Language')}
                    >
                        <current.Flag className={flagClass} />
                        {current.code.toUpperCase()}
                    </button>
                </DropdownMenuTrigger>
            </Hint>
            <DropdownMenuContent
                align="end"
                className="w-44"
                onCloseAutoFocus={(event) => event.preventDefault()}
            >
                {LANGUAGES.map(({ code, name, Flag }) => (
                    <DropdownMenuItem
                        key={code}
                        className="flex cursor-pointer items-center gap-2.5"
                        onSelect={() => code !== locale && changeLocale(code)}
                    >
                        <Flag className={flagClass} />
                        {name}
                        {code === locale && (
                            <Check className="ml-auto size-4" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
