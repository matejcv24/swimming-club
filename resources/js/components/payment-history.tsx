import AddIcon from '@mui/icons-material/Add';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import HistoryIcon from '@mui/icons-material/History';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { POPUP_BG } from '@/components/mui-theme-provider';
import {
    AddButton,
    EmptyState,
    PopupHeader,
    SummaryCard,
    YearSection,
} from '@/components/popup-ui';
import { CardsSkeleton } from '@/components/skeletons';
import { t, tc } from '@/lib/i18n';

/** One membership payment. */
export interface Fee {
    id: number;
    member_id: number;
    member_name?: string | null;
    group_id: number | null;
    // The group as it was, so payments of a deleted group keep its name
    group?: { id: number; name: string } | null;
    amount: number;
    payment_method: 'cash' | 'card';
    start_date: string;
    end_date: string;
    /** When the "payment received" email went out (null: not sent) */
    confirmation_sent_at?: string | null;
    member?: {
        id: number;
        name: string;
    };
}

export const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);

export const methodLabel = (method: 'cash' | 'card') =>
    method === 'card' ? t('Card') : t('Cash');

/** "07.06 – 07.07.2026" (both years only when they differ). */
export const period = (fee: Fee) => {
    const start = dayjs(fee.start_date);
    const end = dayjs(fee.end_date);

    return start.year() === end.year()
        ? `${start.format('DD.MM')} – ${end.format('DD.MM.YYYY')}`
        : `${start.format('DD.MM.YYYY')} – ${end.format('DD.MM.YYYY')}`;
};

/** The payments by year (of their start), newest year first. */
export const feeYears = (fees: Fee[]): [string, Fee[]][] => {
    const years = new Map<string, Fee[]>();

    fees.forEach((fee) => {
        const year = dayjs(fee.start_date).format('YYYY');
        years.set(year, [...(years.get(year) ?? []), fee]);
    });

    return [...years.entries()].sort(([a], [b]) => b.localeCompare(a));
};

/** Top of the history: paid until (green) or expired (red), how many, how much. */
function HistorySummary({ fees }: { fees: Fee[] }) {
    const paidUntil = fees.reduce(
        (latest, fee) =>
            !latest || dayjs(fee.end_date).isAfter(latest)
                ? dayjs(fee.end_date)
                : latest,
        null as dayjs.Dayjs | null,
    );
    const total = fees.reduce((sum, fee) => sum + Number(fee.amount), 0);
    const active = !!paidUntil && !paidUntil.isBefore(dayjs(), 'day');

    return (
        <SummaryCard
            tone={active ? 'green' : 'red'}
            title={
                active
                    ? t('Paid until :date', {
                          date: paidUntil.format('DD.MM.YYYY'),
                      })
                    : t('The membership fee expired on :date', {
                          date: paidUntil?.format('DD.MM.YYYY') ?? '',
                      })
            }
        >
            {tc(':count payment|:count payments', fees.length)} ·{' '}
            {formatCurrency(total)} MKD
        </SummaryCard>
    );
}

/**
 * One payment: the period, whether its confirmation was sent, the amount and
 * how it was paid. Admins tap it (or ⋮) for send, edit and delete.
 */
function HistoryRow({
    fee,
    onOpen,
}: {
    fee: Fee;
    /** Without it the row is only shown (no ⋮). */
    onOpen?: () => void;
}) {
    const content = (
        <>
            <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-[var(--popup-fg)]">
                    {period(fee)}
                </span>
                {fee.confirmation_sent_at ? (
                    <span className="mt-0.5 block text-[13px] font-semibold text-green-600 dark:text-green-400">
                        {t('Confirmation sent on :date', {
                            date: dayjs(fee.confirmation_sent_at).format(
                                'DD.MM.YYYY',
                            ),
                        })}
                    </span>
                ) : (
                    <span className="mt-0.5 block text-[13px] text-[var(--popup-muted)]">
                        {t('No confirmation')}
                    </span>
                )}
            </span>
            <span className="flex-none text-right">
                <span className="block text-[15px] font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(Number(fee.amount))} MKD
                </span>
                <span className="block text-[13px] text-[var(--popup-muted)]">
                    {methodLabel(fee.payment_method)}
                </span>
            </span>
        </>
    );

    if (!onOpen) {
        return (
            <li className="flex items-center gap-3 border-b border-[var(--popup-border)] px-[18px] py-3">
                {content}
            </li>
        );
    }

    return (
        <li className="border-b border-[var(--popup-border)]">
            <button
                type="button"
                onClick={onOpen}
                aria-label={t('Payment :period, actions', {
                    period: period(fee),
                })}
                className="flex w-full cursor-pointer items-center gap-3 px-[18px] py-3 text-left transition hover:bg-[var(--popup-ghost)]"
            >
                {content}
                <MoreVertIcon
                    fontSize="small"
                    className="flex-none text-[var(--popup-muted)]"
                />
            </button>
        </li>
    );
}

/**
 * A member's payments: the summary, then the years (only the newest open), one
 * row per payment. `onOpen` gives each row its ⋮ menu.
 */
export function PaymentHistoryContent({
    fees,
    loading,
    onOpen,
}: {
    fees: Fee[];
    loading: boolean;
    onOpen?: (fee: Fee) => void;
}) {
    if (loading && fees.length === 0) {
        return (
            <div className="px-[18px] pb-4">
                <CardsSkeleton />
            </div>
        );
    }

    if (fees.length === 0) {
        return (
            <EmptyState
                icon={<CreditCardIcon />}
                title={t('No payments recorded yet.')}
            />
        );
    }

    return (
        <>
            {/* Paid until, how many payments, how much in total */}
            <HistorySummary fees={fees} />
            <ul className="border-t border-[var(--popup-border)]">
                {feeYears(fees).map(([year, yearFees], index) => (
                    <YearSection
                        key={year}
                        year={year}
                        summary={`${yearFees.length} · ${formatCurrency(
                            yearFees.reduce(
                                (sum, fee) => sum + Number(fee.amount),
                                0,
                            ),
                        )} MKD`}
                        defaultOpen={index === 0}
                    >
                        {yearFees.map((fee) => (
                            <HistoryRow
                                key={fee.id}
                                fee={fee}
                                onOpen={onOpen ? () => onOpen(fee) : undefined}
                            />
                        ))}
                    </YearSection>
                ))}
            </ul>
        </>
    );
}

/** A member's payment history on its own, e.g. from their card. */
export function MemberPaymentsDialog({
    member,
    onClose,
    onAdd,
}: {
    member: { id: number; name: string } | null;
    onClose: () => void;
    /** The "+" in the header: a new payment for this member. */
    onAdd?: () => void;
}) {
    const [fees, setFees] = useState<Fee[]>([]);
    const [loadedFor, setLoadedFor] = useState<number | null>(null);

    useEffect(() => {
        if (!member) {
            return;
        }

        let current = true;

        fetch(`/membership-fees/by-member/${member.id}`, {
            headers: { Accept: 'application/json' },
        })
            .then((response) => response.json())
            .then((data) => {
                if (current) {
                    setFees(data.fees ?? []);
                    setLoadedFor(member.id);
                }
            })
            .catch(() => {
                if (current) {
                    setFees([]);
                    setLoadedFor(member.id);
                }
            });

        return () => {
            current = false;
        };
    }, [member]);

    const loading = !!member && loadedFor !== member.id;

    return (
        <Dialog
            open={!!member}
            onClose={onClose}
            disableRestoreFocus
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { bgcolor: POPUP_BG } }}
        >
            <PopupHeader
                icon={<HistoryIcon fontSize="small" />}
                title={t('Payment history')}
                subtitle={member?.name ?? ''}
                actions={
                    onAdd && (
                        <AddButton
                            label={t('Add payment')}
                            icon={<AddIcon fontSize="small" />}
                            onClick={onAdd}
                        />
                    )
                }
                onClose={onClose}
            />
            <DialogContent sx={{ p: 0 }}>
                <PaymentHistoryContent
                    fees={loading ? [] : fees}
                    loading={loading}
                />
            </DialogContent>
        </Dialog>
    );
}
