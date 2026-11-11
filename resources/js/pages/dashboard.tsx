import { Head } from '@inertiajs/react';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useState } from 'react';
import { DashboardCards } from '@/components/dashboard-cards';
import MonthlyReportDialog from '@/components/monthly-report-dialog';
import {
    MuiThemeProvider,
    POPUP_BG,
    popupFg,
} from '@/components/mui-theme-provider';
import { CloseButton } from '@/components/popup-ui';

interface Salary {
    id: number;
    amount: number | string;
    month: string;
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

interface GroupedSalaryByMonth {
    month: string;
    total: number;
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
    const [showReportModal, setShowReportModal] = useState(false);
    const [showSalaryModal, setShowSalaryModal] = useState(
        userRole === 'coach' &&
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('salary') === '1',
    );
    const [showSalaryHistoryModal, setShowSalaryHistoryModal] = useState(false);
    const [showSalaryYearDetailModal, setShowSalaryYearDetailModal] =
        useState(false);
    const [selectedSalaryYear, setSelectedSalaryYear] = useState<string | null>(
        null,
    );

    const groupedSalaries: Record<string, GroupedSalaryByMonth> = {};

    coachSalaries.forEach((salary) => {
        const monthKey = dayjs(salary.month)
            .startOf('month')
            .format('YYYY-MM-DD');

        if (!groupedSalaries[monthKey]) {
            groupedSalaries[monthKey] = {
                month: monthKey,
                total: 0,
            };
        }

        groupedSalaries[monthKey].total += Number(salary.amount);
    });

    const sortedSalaryMonths = Object.keys(groupedSalaries).sort().reverse();
    const currentYear = dayjs().format('YYYY');
    const currentYearSalaryMonths = sortedSalaryMonths.filter(
        (month) => dayjs(month).format('YYYY') === currentYear,
    );
    const currentYearLastSalaryMonth = currentYearSalaryMonths[0];
    const currentYearLastSalary = currentYearLastSalaryMonth
        ? groupedSalaries[currentYearLastSalaryMonth]
        : null;

    const salaryYearGroups: Record<
        string,
        { year: string; total: number; monthCount: number }
    > = {};

    Object.values(groupedSalaries).forEach((monthData) => {
        const year = dayjs(monthData.month).format('YYYY');

        if (!salaryYearGroups[year]) {
            salaryYearGroups[year] = {
                year,
                total: 0,
                monthCount: 0,
            };
        }

        salaryYearGroups[year].total += monthData.total;
        salaryYearGroups[year].monthCount += 1;
    });

    const sortedSalaryYears = Object.keys(salaryYearGroups)
        .filter((year) => year !== currentYear)
        .sort()
        .reverse();

    const salaryYearMonths = selectedSalaryYear
        ? sortedSalaryMonths.filter(
              (month) => dayjs(month).format('YYYY') === selectedSalaryYear,
          )
        : [];

    return (
        <MuiThemeProvider>
            {userRole === 'admin' && (
                <MonthlyReportDialog
                    open={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    firstYear={reportFirstYear}
                    paperColor={POPUP_BG}
                />
            )}

            <Head title="Dashboard" />
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

            <Dialog
                open={showSalaryModal}
                onClose={() => setShowSalaryModal(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        height: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: POPUP_BG,
                    },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Salary
                        </Typography>
                        <CloseButton
                            onClick={() => setShowSalaryModal(false)}
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    <div className="flex flex-col gap-6 p-4">
                        <div className="flex flex-col gap-4">
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                Salary History By Month
                            </Typography>

                            {currentYearLastSalary ? (
                                <List disablePadding>
                                    <ListItem
                                        divider
                                        sx={{
                                            px: 0,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: 'auto',
                                            gap: 2,
                                            paddingY: 1.5,
                                            alignItems: 'center',
                                            '&:hover': {
                                                bgcolor: popupFg(0.05),
                                            },
                                        }}
                                        onClick={() =>
                                            setShowSalaryHistoryModal(true)
                                        }
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '16px',
                                            }}
                                        >
                                            <Typography variant="body2">
                                                {dayjs(
                                                    currentYearLastSalary.month,
                                                ).format('MMMM YYYY')}
                                            </Typography>
                                            {currentYearSalaryMonths.length >
                                                1 && (
                                                <Typography
                                                    variant="caption"
                                                    color="primary"
                                                >
                                                    {
                                                        currentYearSalaryMonths.length
                                                    }{' '}
                                                    months
                                                </Typography>
                                            )}
                                        </div>

                                        <Chip
                                            label={`${formatCurrency(currentYearLastSalary.total)} MKD`}
                                            color="success"
                                            size="small"
                                        />
                                    </ListItem>
                                </List>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No salary payments recorded for{' '}
                                    {currentYear}.
                                </Typography>
                            )}
                        </div>

                        <Divider />

                        <div className="flex flex-col gap-4">
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                Salary History By Year
                            </Typography>

                            {sortedSalaryYears.length > 0 ? (
                                <List disablePadding>
                                    {sortedSalaryYears.map((year) => (
                                        <ListItem
                                            key={year}
                                            divider
                                            sx={{
                                                px: 0,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: 'auto',
                                                gap: 2,
                                                paddingY: 1.5,
                                                alignItems: 'center',
                                                '&:hover': {
                                                    bgcolor: popupFg(0.05),
                                                },
                                            }}
                                            onClick={() => {
                                                setSelectedSalaryYear(year);
                                                setShowSalaryYearDetailModal(
                                                    true,
                                                );
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                }}
                                            >
                                                <Typography variant="body2">
                                                    {year}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="primary"
                                                >
                                                    {
                                                        salaryYearGroups[year]
                                                            .monthCount
                                                    }{' '}
                                                    months
                                                </Typography>
                                            </div>

                                            <Chip
                                                label={`${formatCurrency(
                                                    salaryYearGroups[year]
                                                        .total,
                                                )} MKD`}
                                                color="success"
                                                size="small"
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No past-year salary history yet.
                                </Typography>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showSalaryHistoryModal}
                onClose={() => setShowSalaryHistoryModal(false)}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: POPUP_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Salary History By Month
                        </Typography>
                        <CloseButton
                            onClick={() => setShowSalaryHistoryModal(false)}
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    <List disablePadding>
                        {currentYearSalaryMonths.map((month) => {
                            const monthData = groupedSalaries[month];

                            return (
                                <ListItem
                                    key={month}
                                    divider
                                    sx={{
                                        px: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2">
                                                {dayjs(month).format(
                                                    'MMMM YYYY',
                                                )}
                                            </Typography>
                                        }
                                        sx={{ flex: '1 1 auto', minWidth: 0 }}
                                    />
                                    <Chip
                                        label={`${formatCurrency(monthData.total)} MKD`}
                                        color="success"
                                        size="small"
                                        sx={{ flexShrink: 0 }}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showSalaryYearDetailModal}
                onClose={() => {
                    setShowSalaryYearDetailModal(false);
                    setSelectedSalaryYear(null);
                }}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: POPUP_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Salary History - {selectedSalaryYear}
                        </Typography>
                        <CloseButton
                            onClick={() => {
                                setShowSalaryYearDetailModal(false);
                                setSelectedSalaryYear(null);
                            }}
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    <List disablePadding>
                        {salaryYearMonths.map((month) => {
                            const monthData = groupedSalaries[month];

                            return (
                                <ListItem
                                    key={month}
                                    divider
                                    sx={{
                                        px: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2">
                                                {dayjs(month).format(
                                                    'MMMM YYYY',
                                                )}
                                            </Typography>
                                        }
                                        sx={{ flex: '1 1 auto', minWidth: 0 }}
                                    />
                                    <Chip
                                        label={`${formatCurrency(monthData.total)} MKD`}
                                        color="success"
                                        size="small"
                                        sx={{ flexShrink: 0 }}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
}
