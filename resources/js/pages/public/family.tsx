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

    const unpaidSince = member.paid_until
        ? dayjs(member.paid_until).add(1, 'day').format('YYYY-MM-DD')
        : null;

    return (
        <section className="rounded-2xl bg-white p-5 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">
                        {member.name}
                    </h2>
                    {member.group && (
                        <p className="text-sm text-slate-500">{member.group}</p>
                    )}
                </div>
                <span
                    className={`flex-none rounded-full px-3 py-1 text-xs font-bold ${
                        member.late
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-green-500/10 text-green-700'
                    }`}
                >
                    {!member.paid_until
                        ? t('No payment on record')
                        : member.late && unpaidSince
                          ? t('Unpaid since :date', { date: date(unpaidSince) })
                          : t('Paid until :date', {
                                date: date(member.paid_until),
                            })}
                </span>
            </div>

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
                    <div className="flex flex-col gap-3">
                        <p className="text-xs text-slate-500">
                            {t('Last 12 months')}
                        </p>
                        {member.attendance.map((month) => (
                            <div key={month.month}>
                                <p className="flex items-center justify-between text-sm font-bold">
                                    <span className="capitalize">
                                        {dayjs(`${month.month}-01`).format(
                                            'MMMM YYYY',
                                        )}
                                    </span>
                                    <span className="text-xs font-semibold text-hydra-blue">
                                        {tc(
                                            ':count training|:count trainings',
                                            month.dates.length,
                                        )}
                                    </span>
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {month.dates.map((day) => (
                                        <span
                                            key={day}
                                            className="rounded-full bg-[#e6f1f8] px-2.5 py-1 text-xs font-semibold"
                                        >
                                            {dayjs(day).format('DD.MM')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
