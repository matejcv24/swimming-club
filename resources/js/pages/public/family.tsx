import { Head, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { HuddleMark } from '@/components/huddle-mark';
import { LanguageSwitch } from '@/components/language-switch';
import { t, tc } from '@/lib/i18n';
import type { ClubSharedData } from '@/types/club';

interface FamilyMember {
    id: number;
    name: string;
    group: string | null;
    paid_until: string | null;
    late: boolean;
    fees: { start_date: string; end_date: string; amount: number }[];
    attendance: { month: string; dates: string[] }[];
}

interface Props {
    members: FamilyMember[];
}

const date = (value: string) => dayjs(value).format('DD.MM.YYYY');
const money = (value: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);

/**
 * What a parent (or an adult member) sees from the link in a payment reminder:
 * each member's payments and attendance. Read only, no login.
 */
export default function Family({ members }: Props) {
    const { club } = usePage().props as { club?: ClubSharedData | null };
    // Brothers and sisters: one at a time, so the page fits the screen
    const [shownId, setShownId] = useState(members[0]?.id);
    const shown = members.find((m) => m.id === shownId) ?? members[0];

    return (
        // Fills the screen exactly; everything inside is sized to fit it
        <div className="light flex min-h-svh flex-col items-center bg-hydra-navy px-4 py-[min(1.25rem,2.5svh)] text-hydra-navy">
            <Head title={t('Attendance and payments')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="relative flex w-full max-w-md flex-1 flex-col justify-center gap-[min(1rem,2svh)]">
                <div className="absolute top-0 right-0 text-white">
                    <LanguageSwitch />
                </div>

                {/* The club's logo and name; without a logo, the app's own mark */}
                <div className="flex flex-col items-center gap-[min(0.4rem,1svh)]">
                    {club?.logo_url ? (
                        <img
                            src={club.logo_url}
                            alt=""
                            className="size-[min(4rem,9svh)] rounded-full object-cover shadow-[0_0_0_3px_rgb(255_255_255/0.18)]"
                        />
                    ) : (
                        <HuddleMark onDark className="size-[min(4rem,9svh)]" />
                    )}
                    <p className="text-base font-bold text-white">
                        {club?.name}
                    </p>
                </div>

                {members.length > 1 && (
                    <div
                        role="tablist"
                        aria-label={t('Members')}
                        className="flex flex-wrap justify-center gap-2"
                    >
                        {members.map((member) => (
                            <button
                                key={member.id}
                                type="button"
                                role="tab"
                                aria-selected={member.id === shown?.id}
                                onClick={() => setShownId(member.id)}
                                className={`min-h-9 cursor-pointer rounded-full px-4 text-sm font-bold transition ${
                                    member.id === shown?.id
                                        ? 'bg-white text-hydra-navy'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                {member.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                )}

                {shown && <MemberCard key={shown.id} member={shown} />}

                <p className="text-center text-xs text-sky-200/80">
                    {t(
                        'If you have any questions, contact someone from the club.',
                    )}
                </p>
            </div>
        </div>
    );
}

/** One member: paid until (or unpaid since), then payments or attendance. */
function MemberCard({ member }: { member: FamilyMember }) {
    const [tab, setTab] = useState<'payments' | 'attendance'>('payments');

    return (
        <section className="rounded-2xl bg-white p-[min(1.25rem,2.5svh)] shadow-2xl shadow-black/30">
            <h2 className="text-lg leading-snug font-bold break-words">
                {member.name}
            </h2>
            {member.group && (
                <p className="text-sm text-slate-500">{member.group}</p>
            )}

            {/* Paid or not, as one full line: never squeezed next to the name */}
            <p
                className={`mt-[min(0.75rem,1.5svh)] flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                    member.late
                        ? 'bg-red-500/10 text-red-700'
                        : 'bg-green-500/10 text-green-800'
                }`}
            >
                <span
                    aria-hidden="true"
                    className={`size-2 flex-none rounded-full ${member.late ? 'bg-red-500' : 'bg-green-500'}`}
                />
                {!member.paid_until
                    ? t('No payment on record')
                    : member.late
                      ? t('The membership fee expired on :date', {
                            date: date(member.paid_until),
                        })
                      : t('Paid until :date', {
                            date: date(member.paid_until),
                        })}
            </p>

            {/* Payments | Attendance */}
            <div
                role="tablist"
                className="mt-[min(1rem,2svh)] flex gap-1 rounded-full bg-[#e6f1f8] p-1"
            >
                {(['payments', 'attendance'] as const).map((key) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={tab === key}
                        onClick={() => setTab(key)}
                        className={`min-h-[min(2.5rem,5svh)] flex-1 cursor-pointer rounded-full text-sm font-bold transition ${
                            tab === key
                                ? 'bg-white text-hydra-navy shadow-[0_1px_4px_rgba(0,16,49,0.18)]'
                                : 'text-slate-500'
                        }`}
                    >
                        {key === 'payments' ? t('Payments') : t('Attendance')}
                    </button>
                ))}
            </div>

            <div className="mt-3">
                {tab === 'payments' ? (
                    <PaymentsBrowser fees={member.fees} />
                ) : (
                    <AttendanceBrowser attendance={member.attendance} />
                )}
            </div>
        </section>
    );
}

/**
 * One month as a small calendar (Monday first): the days of a training are
 * filled in the club's blue.
 */
function MonthCalendar({ month, dates }: { month: string; dates: string[] }) {
    const first = dayjs(`${month}-01`);
    const trained = new Set(dates.map((day) => dayjs(day).date()));
    // Empty cells before the 1st, so it falls on its weekday
    const offset = (first.day() + 6) % 7;
    const cells: (number | null)[] = [
        ...Array.from({ length: offset }, () => null),
        ...Array.from({ length: first.daysInMonth() }, (_, i) => i + 1),
    ];
    const weekdays = t('Mon,Tue,Wed,Thu,Fri,Sat,Sun').split(',');

    return (
        <div>
            <div className="grid grid-cols-7 gap-[min(0.25rem,0.5svh)] text-center">
                {weekdays.map((day, i) => (
                    <span
                        key={`${day}-${i}`}
                        className="text-[11px] font-semibold text-slate-400"
                    >
                        {day}
                    </span>
                ))}
                {cells.map((day, i) =>
                    day === null ? (
                        <span key={`empty-${i}`} />
                    ) : (
                        <span
                            key={day}
                            aria-label={
                                trained.has(day)
                                    ? t(':date: trained', {
                                          date: first
                                              .date(day)
                                              .format('DD.MM.YYYY'),
                                      })
                                    : undefined
                            }
                            className={`mx-auto flex size-[min(2rem,4.2svh)] items-center justify-center rounded-full text-xs ${
                                trained.has(day)
                                    ? 'bg-hydra-blue font-bold text-white shadow-[0_2px_6px_rgba(22,144,200,0.35)]'
                                    : 'text-slate-400'
                            }`}
                        >
                            {day}
                        </span>
                    ),
                )}
            </div>
        </div>
    );
}

/** How many payments show at once. */
const PAYMENTS_PER_PAGE = 3;

/** The payments, newest first, three at a time with ‹ › to move through them. */
function PaymentsBrowser({ fees }: { fees: FamilyMember['fees'] }) {
    const [page, setPage] = useState(0);
    const pages = Math.max(1, Math.ceil(fees.length / PAYMENTS_PER_PAGE));

    if (fees.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#e6f1f8] text-hydra-blue">
                    <ReceiptIcon />
                </span>
                <p className="text-sm font-bold">{t('No payments yet.')}</p>
                <p className="text-xs text-slate-500">
                    {t('Payments appear here once the club records them.')}
                </p>
            </div>
        );
    }

    const shown = fees.slice(
        page * PAYMENTS_PER_PAGE,
        (page + 1) * PAYMENTS_PER_PAGE,
    );

    return (
        <div>
            <ul className="divide-y divide-slate-100">
                {shown.map((fee, i) => (
                    <li
                        key={`${fee.start_date}-${i}`}
                        className="flex items-center gap-3 py-[min(0.6rem,1.2svh)]"
                    >
                        <span className="flex size-8 flex-none items-center justify-center rounded-full bg-green-500/15 text-green-700">
                            <CheckIcon />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold capitalize">
                                {dayjs(fee.start_date).format('MMMM YYYY')}
                            </span>
                            <span className="block text-xs text-slate-500">
                                {dayjs(fee.start_date).format('DD.MM')} –{' '}
                                {date(fee.end_date)}
                            </span>
                        </span>
                        <span className="flex-none text-sm font-bold text-green-700">
                            {money(fee.amount)} MKD
                        </span>
                    </li>
                ))}
            </ul>
            {pages > 1 && (
                <Pager
                    // Like the calendar: "‹" older payments, "›" newer; the newest
                    // page is the last number (e.g. 3 / 3)
                    label={`${pages - page} / ${pages}`}
                    leftEnabled={page < pages - 1}
                    rightEnabled={page > 0}
                    onLeft={() => setPage(page + 1)}
                    onRight={() => setPage(page - 1)}
                />
            )}
        </div>
    );
}

/**
 * Attendance one month at a time, newest first: ‹ Month · N trainings › moves
 * through every month since the first training (up to 12), also those without.
 */
function AttendanceBrowser({
    attendance,
}: {
    attendance: FamilyMember['attendance'];
}) {
    const current = dayjs().startOf('month');
    const oldest = attendance.reduce(
        (first, month) =>
            dayjs(`${month.month}-01`).isBefore(first)
                ? dayjs(`${month.month}-01`)
                : first,
        current,
    );
    const count = Math.min(12, current.diff(oldest, 'month') + 1);
    // 0 = this month, 1 = the month before, ...
    const [back, setBack] = useState(0);

    if (attendance.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#e6f1f8] text-hydra-blue">
                    <CalendarIcon />
                </span>
                <p className="text-sm font-bold">{t('No trainings yet.')}</p>
            </div>
        );
    }

    const month = current.subtract(back, 'month').format('YYYY-MM');
    const dates = attendance.find((m) => m.month === month)?.dates ?? [];

    return (
        <div className="flex flex-col gap-3">
            <Pager
                label={
                    <>
                        <span className="capitalize">
                            {dayjs(`${month}-01`).format('MMMM YYYY')}
                        </span>
                        <span className="font-semibold text-hydra-blue">
                            {' · '}
                            {tc(
                                ':count training|:count trainings',
                                dates.length,
                            )}
                        </span>
                    </>
                }
                // Months: "‹" the month before, "›" the month after
                leftEnabled={back < count - 1}
                rightEnabled={back > 0}
                onLeft={() => setBack(back + 1)}
                onRight={() => setBack(back - 1)}
            />
            <MonthCalendar month={month} dates={dates} />
        </div>
    );
}

/** ‹ label ›: round arrow buttons, greyed out when there's nothing further. */
function Pager({
    label,
    leftEnabled,
    rightEnabled,
    onLeft,
    onRight,
}: {
    label: ReactNode;
    leftEnabled: boolean;
    rightEnabled: boolean;
    onLeft: () => void;
    onRight: () => void;
}) {
    const arrow =
        'flex size-[min(2.5rem,5svh)] min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-full border border-[#c5dceb] text-hydra-blue transition hover:bg-[#e6f1f8] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent';

    return (
        <div className="mt-1 flex items-center justify-between gap-2">
            <button
                type="button"
                onClick={onLeft}
                disabled={!leftEnabled}
                aria-label={t('Previous')}
                className={arrow}
            >
                <ChevronIcon direction="left" />
            </button>
            <span className="min-w-0 text-center text-sm font-bold">
                {label}
            </span>
            <button
                type="button"
                onClick={onRight}
                disabled={!rightEnabled}
                aria-label={t('Next')}
                className={arrow}
            >
                <ChevronIcon direction="right" />
            </button>
        </div>
    );
}

const iconProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
};

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
    return (
        <svg {...iconProps}>
            <path
                d={direction === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg {...iconProps} width={16} height={16}>
            <path d="M5 12l5 5L20 7" />
        </svg>
    );
}

function ReceiptIcon() {
    return (
        <svg {...iconProps}>
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg {...iconProps}>
            <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />
        </svg>
    );
}
