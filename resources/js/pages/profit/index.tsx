import { Head } from '@inertiajs/react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import dayjs from 'dayjs';
import { useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import { MuiThemeProvider, POPUP_BG } from '@/components/mui-theme-provider';
import {
    DrillRow,
    EmptyState,
    PopupHeader,
    SummaryCard,
    YearSection,
} from '@/components/popup-ui';
import { usePagePopup } from '@/hooks/use-page-popup';
import { t } from '@/lib/i18n';

interface ProfitRow {
    month: string;
    memberships: number;
    salaries: number;
    invoices: number;
    profit: number;
}

interface Props {
    profits: ProfitRow[];
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
};

/** "+12,500" or "−8,300": profit is green when it's a gain, red when a loss. */
const signed = (value: number) =>
    `${value < 0 ? '−' : '+'}${formatCurrency(Math.abs(value))}`;

const profitColor = (value: number) =>
    value < 0
        ? 'text-red-500 dark:text-red-400'
        : 'text-green-600 dark:text-green-400';

export default function ProfitIndex({ profits }: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    // The month whose breakdown is open
    const [openMonth, setOpenMonth] = useState<ProfitRow | null>(null);

    // The months by year, newest first
    const years = (() => {
        const grouped = new Map<string, ProfitRow[]>();

        [...profits]
            .sort((a, b) => b.month.localeCompare(a.month))
            .forEach((row) => {
                const year = dayjs(row.month).format('YYYY');
                grouped.set(year, [...(grouped.get(year) ?? []), row]);
            });

        return [...grouped.entries()].sort(([a], [b]) => b.localeCompare(a));
    })();

    const sum = (rows: ProfitRow[], key: keyof Omit<ProfitRow, 'month'>) =>
        rows.reduce((total, row) => total + row[key], 0);

    const latestYear = years[0];
    const latestTotal = latestYear ? sum(latestYear[1], 'profit') : 0;

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title={t('Profit')} />

            <Dialog
                {...popup.dialogProps}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: POPUP_BG,
                    },
                }}
            >
                <PopupHeader
                    icon={<TrendingUpIcon fontSize="small" />}
                    title={t('Profit')}
                    subtitle={t('Fees minus invoices and salaries')}
                    onClose={popup.close}
                />

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    {!latestYear ? (
                        <EmptyState
                            icon={<TrendingUpIcon />}
                            title={t('No profit recorded yet')}
                            text={t(
                                'It shows up once fees, salaries or invoices are entered.',
                            )}
                        />
                    ) : (
                        <>
                            <SummaryCard
                                tone={latestTotal < 0 ? 'red' : 'green'}
                                title={`${latestYear[0]}: ${signed(latestTotal)} MKD`}
                            >
                                +{formatCurrency(sum(latestYear[1], 'memberships'))}{' '}
                                {t('fees')} · −
                                {formatCurrency(
                                    sum(latestYear[1], 'salaries') +
                                        sum(latestYear[1], 'invoices'),
                                )}{' '}
                                {t('costs')}
                            </SummaryCard>
                            <ul className="border-t border-[var(--popup-border)]">
                                {years.map(([year, rows], index) => (
                                    <YearSection
                                        key={year}
                                        year={year}
                                        summary={`${signed(sum(rows, 'profit'))} MKD`}
                                        defaultOpen={index === 0}
                                    >
                                        {rows.map((row) => (
                                            <DrillRow
                                                key={row.month}
                                                title={
                                                    <span className="capitalize">
                                                        {dayjs(row.month).format(
                                                            'MMMM YYYY',
                                                        )}
                                                    </span>
                                                }
                                                subtitle={`+${formatCurrency(row.memberships)} ${t('fees')} · −${formatCurrency(row.salaries + row.invoices)} ${t('costs')}`}
                                                value={signed(row.profit)}
                                                valueClassName={profitColor(
                                                    row.profit,
                                                )}
                                                onClick={() => setOpenMonth(row)}
                                            />
                                        ))}
                                    </YearSection>
                                ))}
                            </ul>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* One month: where the profit comes from */}
            <Dialog
                open={!!openMonth}
                onClose={() => setOpenMonth(null)}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                {openMonth && (
                    <>
                        <PopupHeader
                            icon={<TrendingUpIcon fontSize="small" />}
                            title={t('Profit')}
                            subtitle={dayjs(openMonth.month).format(
                                'MMMM YYYY',
                            )}
                            onClose={() => setOpenMonth(null)}
                        />
                        <SummaryCard
                            tone={openMonth.profit < 0 ? 'red' : 'green'}
                            title={`${signed(openMonth.profit)} MKD`}
                        >
                            {openMonth.profit < 0
                                ? t('More went out than came in')
                                : t('More came in than went out')}
                        </SummaryCard>
                        <ul className="mb-3 border-t border-[var(--popup-border)]">
                            {[
                                {
                                    label: t('Membership Fees'),
                                    value: openMonth.memberships,
                                    sign: 1,
                                },
                                {
                                    label: t('Salaries'),
                                    value: openMonth.salaries,
                                    sign: -1,
                                },
                                {
                                    label: t('Invoices'),
                                    value: openMonth.invoices,
                                    sign: -1,
                                },
                            ].map((part) => (
                                <li
                                    key={part.label}
                                    className="flex items-center justify-between border-b border-[var(--popup-border)] px-[18px] py-3"
                                >
                                    <span className="text-[15px] font-semibold text-[var(--popup-fg)]">
                                        {part.label}
                                    </span>
                                    <span
                                        className={`text-[15px] font-bold ${
                                            part.sign > 0
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-[var(--popup-fg)]'
                                        }`}
                                    >
                                        {part.sign > 0 ? '+' : '−'}
                                        {formatCurrency(part.value)} MKD
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </Dialog>
        </MuiThemeProvider>
    );
}

