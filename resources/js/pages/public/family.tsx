import { Head, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import { useState } from 'react';
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
    expiresAt: string;
}

const date = (value: string) => dayjs(value).format('DD.MM.YYYY');
const money = (value: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);

/**
 * What a parent (or an adult member) sees from the link in a payment reminder:
 * each member's payments and attendance. Read only, no login.
 */
export default function Family({ members, expiresAt }: Props) {
    const { club } = usePage().props as { club?: ClubSharedData | null };

    return (
        <div className="light min-h-svh bg-hydra-navy px-4 py-6 text-hydra-navy">
            <Head title={t('Attendance and payments')}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="mx-auto flex max-w-lg flex-col gap-5">
                <div className="flex justify-end text-white">
                    <LanguageSwitch />
                </div>

                {/* The club's logo and name; without a logo, the app's own mark */}
                <div className="flex flex-col items-center gap-2">
                    {club?.logo_url ? (
                        <img
                            src={club.logo_url}
                            alt=""
                            className="size-20 rounded-full object-cover shadow-[0_0_0_3px_rgb(255_255_255/0.18)]"
                        />
                    ) : (
                        <HuddleMark onDark className="size-20" />
                    )}
                    <p className="text-lg font-bold text-white">{club?.name}</p>
                    <h1 className="text-sm text-sky-200">
                        {t('Attendance and payments')}
                    </h1>
                </div>

                {members.map((member) => (
                    <MemberCard key={member.id} member={member} />
                ))}

                <p className="text-center text-xs text-sky-200/80">
                    {t('This page works until :date.', {
                        date: date(expiresAt),
                    })}{' '}
                    {t("Questions? Reply to the club's email.")}
                </p>
            </div>
        </div>
    );
}

/** One member: paid until (or unpaid since), then payments or attendance. */
function MemberCard({ member }: { member: FamilyMember }) {
    const [tab, setTab] = useState<'payments' | 'attendance'>('payments');

    return (
        <section className="rounded-2xl bg-white p-5 shadow-2xl shadow-black/30">
            <h2 className="text-lg leading-snug font-bold break-words">
                {member.name}
            </h2>
            {member.group && (
                <p className="text-sm text-slate-500">{member.group}</p>
            )}

            {/* Paid or not, as one full line: never squeezed next to the name */}
            <p
                className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
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
                className="mt-4 flex gap-1 rounded-full bg-[#e6f1f8] p-1"
            >
                {(['payments', 'attendance'] as const).map((key) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={tab === key}
                        onClick={() => setTab(key)}
                        className={`min-h-10 flex-1 cursor-pointer rounded-full text-sm font-bold transition ${
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
                    member.fees.length === 0 ? (
                        <p className="py-4 text-center text-sm text-slate-500">
                            {t('No payments yet.')}
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {member.fees.map((fee, i) => (
                                <li
                                    key={`${fee.start_date}-${i}`}
                                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                                >
                                    <span>
                                        {date(fee.start_date)} –{' '}
                                        {date(fee.end_date)}
                                    </span>
                                    <span className="flex-none rounded-full bg-green-500/10 px-2.5 py-0.5 font-bold text-green-700">
                                        {money(fee.amount)} MKD
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )
                ) : member.attendance.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">
                        {t('No attendance in the last 12 months.')}
                    </p>
                ) : (
                    <div className="flex flex-col gap-5">
                        <p className="text-xs text-slate-500">
                            {t('Last 12 months')}
                        </p>
                        {member.attendance.map((month) => (
                            <MonthCalendar
                                key={month.month}
                                month={month.month}
                                dates={month.dates}
                            />
                        ))}
                    </div>
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
            <p className="mb-2 flex items-center justify-between text-sm font-bold">
                <span className="capitalize">{first.format('MMMM YYYY')}</span>
                <span className="rounded-full bg-hydra-blue/10 px-2.5 py-0.5 text-xs font-bold text-hydra-blue">
                    {tc(':count training|:count trainings', dates.length)}
                </span>
            </p>
            <div className="grid grid-cols-7 gap-1 text-center">
                {weekdays.map((day, i) => (
                    <span
                        key={`${day}-${i}`}
                        className="pb-1 text-[11px] font-semibold text-slate-400"
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
                            className={`mx-auto flex size-8 items-center justify-center rounded-full text-xs ${
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
