import { Head, router } from '@inertiajs/react';
import PaymentsIcon from '@mui/icons-material/Payments';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { DashboardCards } from '@/components/dashboard-cards';
import MonthlyReportDialog from '@/components/monthly-report-dialog';
import { MuiThemeProvider, POPUP_BG } from '@/components/mui-theme-provider';
import {
    EmptyState,
    PopupHeader,
    SummaryCard,
    YearSection,
} from '@/components/popup-ui';
import {
    QuickActionsBar,
    QuickActionsSpacer,
} from '@/components/quick-actions';
import { PopupSkeleton } from '@/components/skeletons';
import { useDashboardScroll } from '@/hooks/use-dashboard-scroll';
import { usePendingPopup } from '@/hooks/use-pending-popup';
import { t, tc } from '@/lib/i18n';

interface Salary {
    id: number;
    amount: number | string;
    month: string;
    created_at?: string | null;
}

interface Props {
    userRole?: 'admin' | 'coach';
    activeMembers?: number;
    profitTotal?: number;
    unpaidFees?: number;
    invoiceTotal?: number;
    coachSalaryTotal?: number;
    coachSalaries?: Salary[];
    reportFirstYear?: number | null;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function Dashboard({
    userRole = 'admin',
    activeMembers = 0,
    profitTotal = 0,
    unpaidFees = 0,
    invoiceTotal = 0,
    coachSalaryTotal = 0,
    coachSalaries = [],
    reportFirstYear = null,
}: Props) {
    const pendingPopup = usePendingPopup();
    // Back where the user was after closing a pop-up
    useDashboardScroll();
    const [showReportModal, setShowReportModal] = useState(false);
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    // A coach's salary notification opens the salary history (?salary=1)
    const salaryLink = (url: string) =>
        userRole === 'coach' &&
        new URL(url, 'http://x').searchParams.get('salary') === '1';
    const [showSalaryHistoryModal, setShowSalaryHistoryModal] = useState(
        () => typeof window !== 'undefined' && salaryLink(window.location.href),
    );

    // Also when the dashboard is already open (tapping the notification there)
    useEffect(
        () =>
            router.on('navigate', (event) => {
                if (salaryLink(event.detail.page.url)) {
                    setShowSalaryHistoryModal(true);
                }
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userRole],
    );

    const closeSalaries = () => {
        setShowSalaryModal(false);
        setShowSalaryHistoryModal(false);
    };

    // The salaries by year (of their month), newest first
    const salaryYears = (() => {
        const years = new Map<string, Salary[]>();

        [...coachSalaries]
            .sort((a, b) => b.month.localeCompare(a.month))
            .forEach((salary) => {
                const year = dayjs(salary.month).format('YYYY');
                years.set(year, [...(years.get(year) ?? []), salary]);
            });

        return [...years.entries()].sort(([a], [b]) => b.localeCompare(a));
    })();

    const yearTotal = (salaries: Salary[]) =>
        salaries.reduce((sum, salary) => sum + Number(salary.amount), 0);

    return (
        <MuiThemeProvider>
            {/* Slow connection: the tapped card's pop-up frame, until its page arrives */}
            <PopupSkeleton
                open={pendingPopup !== null}
                title={pendingPopup ?? ''}
            />

            {userRole === 'admin' && (
                <MonthlyReportDialog
                    open={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    firstYear={reportFirstYear}
                    paperColor={POPUP_BG}
                />
            )}

            <Head title={t('Dashboard')} />
            <DashboardCards
                userRole={userRole}
                activeMembers={activeMembers}
                unpaidFees={unpaidFees}
                invoiceTotal={invoiceTotal}
                profitTotal={profitTotal}
                coachSalaryTotal={coachSalaryTotal}
                onOpenSalary={() => setShowSalaryModal(true)}
                onOpenReport={() => setShowReportModal(true)}
            />
            {/* Phones: the quick actions bar, and room for it under the last card */}
            <QuickActionsSpacer />
            <QuickActionsBar />

            {/* A coach's own salaries: like a member's payment history, read only */}
            <Dialog
                open={showSalaryModal || showSalaryHistoryModal}
                onClose={closeSalaries}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <PopupHeader
                    icon={<PaymentsIcon fontSize="small" />}
                    title={t('Salary history')}
                    subtitle={t('Your salaries')}
                    onClose={closeSalaries}
                />
                <DialogContent sx={{ p: 0 }}>
                    {coachSalaries.length === 0 ? (
                        <EmptyState
                            icon={<PaymentsIcon />}
                            title={t('No salaries entered yet')}
                            text={t(
                                'They show up here once the first is entered.',
                            )}
                        />
                    ) : (
                        <>
                            <SummaryCard
                                tone="blue"
                                title={t('Last salary: :month', {
                                    month: dayjs(salaryYears[0][1][0].month).format(
                                        'MMMM YYYY',
                                    ),
                                })}
                            >
                                {salaryYears[0][0]}:{' '}
                                {tc(
                                    ':count salary|:count salaries',
                                    salaryYears[0][1].length,
                                )}{' '}
                                · {formatCurrency(yearTotal(salaryYears[0][1]))}{' '}
                                MKD
                            </SummaryCard>
                            <ul className="border-t border-[var(--popup-border)]">
                                {salaryYears.map(([year, salaries], index) => (
                                    <YearSection
                                        key={year}
                                        year={year}
                                        summary={`${tc(':count salary|:count salaries', salaries.length)} · ${formatCurrency(yearTotal(salaries))} MKD`}
                                        defaultOpen={index === 0}
                                    >
                                        {salaries.map((salary) => (
                                            <li
                                                key={salary.id}
                                                className="flex items-center gap-3 border-b border-[var(--popup-border)] px-[18px] py-3"
                                            >
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-[15px] font-semibold text-[var(--popup-fg)] capitalize">
                                                        {dayjs(
                                                            salary.month,
                                                        ).format('MMMM YYYY')}
                                                    </span>
                                                    {salary.created_at && (
                                                        <span className="block text-[13px] text-[var(--popup-muted)]">
                                                            {t(
                                                                'Entered on :date',
                                                                {
                                                                    date: dayjs(
                                                                        salary.created_at,
                                                                    ).format(
                                                                        'DD.MM.YYYY',
                                                                    ),
                                                                },
                                                            )}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="flex-none text-[15px] font-bold whitespace-nowrap text-green-600 dark:text-green-400">
                                                    {formatCurrency(
                                                        Number(salary.amount),
                                                    )}{' '}
                                                    MKD
                                                </span>
                                            </li>
                                        ))}
                                    </YearSection>
                                ))}
                            </ul>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
}
