import { Head, router } from '@inertiajs/react';
import CloseIcon from '@mui/icons-material/Close';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { apiRequest } from '@/lib/api';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

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
}

interface DashboardResponse {
    userRole: 'admin' | 'coach';
    activeMembers: number;
    profitTotal: number;
    unpaidFees: number;
    invoiceTotal: number;
    coachSalaryTotal: number;
    coachSalaries: Salary[];
}

interface GroupedSalaryByMonth {
    month: string;
    total: number;
}

const darkTheme = createTheme({
    palette: { mode: 'dark' },
});

const DARK_BG = '#1d232a';

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function Dashboard({
    userRole: initialUserRole,
    activeMembers: initialActiveMembers = 0,
    profitTotal: initialProfitTotal = 0,
    unpaidFees: initialUnpaidFees = 0,
    invoiceTotal: initialInvoiceTotal = 0,
    coachSalaryTotal: initialCoachSalaryTotal = 0,
    coachSalaries: initialCoachSalaries = [],
}: Props) {
    const [userRole, setUserRole] = useState<'admin' | 'coach' | null>(
        initialUserRole ?? null,
    );
    const [activeMembers, setActiveMembers] = useState(initialActiveMembers);
    const [profitTotal, setProfitTotal] = useState(initialProfitTotal);
    const [unpaidFees, setUnpaidFees] = useState(initialUnpaidFees);
    const [invoiceTotal, setInvoiceTotal] = useState(initialInvoiceTotal);
    const [coachSalaryTotal, setCoachSalaryTotal] = useState(
        initialCoachSalaryTotal,
    );
    const [coachSalaries, setCoachSalaries] = useState(initialCoachSalaries);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
    const [dashboardError, setDashboardError] = useState<string | null>(null);
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [showSalaryHistoryModal, setShowSalaryHistoryModal] = useState(false);
    const [showSalaryYearDetailModal, setShowSalaryYearDetailModal] =
        useState(false);
    const [selectedSalaryYear, setSelectedSalaryYear] = useState<string | null>(
        null,
    );

    useEffect(() => {
        const loadDashboard = async () => {
            setIsLoadingDashboard(true);
            setDashboardError(null);

            try {
                const data =
                    await apiRequest<DashboardResponse>('/api/dashboard');

                setUserRole(data.userRole);
                setActiveMembers(data.activeMembers);
                setProfitTotal(data.profitTotal);
                setUnpaidFees(data.unpaidFees);
                setInvoiceTotal(data.invoiceTotal);
                setCoachSalaryTotal(data.coachSalaryTotal);
                setCoachSalaries(data.coachSalaries);
            } catch {
                setDashboardError('Unable to refresh dashboard data.');
            } finally {
                setIsLoadingDashboard(false);
            }
        };

        void loadDashboard();
    }, []);

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
        <ThemeProvider theme={darkTheme}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <h1 className="text-2xl font-bold">Swimming Club Hydra</h1>

                {dashboardError && (
                    <p className="text-sm text-red-600">{dashboardError}</p>
                )}

                {isLoadingDashboard && (
                    <p className="text-sm text-muted-foreground">
                        Loading dashboard...
                    </p>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                    {userRole === 'admin' && (
                        <button
                            onClick={() => router.visit('/profit')}
                            className="cursor-pointer rounded-xl border border-sidebar-border/70 bg-white p-6 text-left shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-lg dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        >
                            <p className="text-sm text-gray-500">Profit</p>
                            <p className="mt-2 text-4xl font-bold">
                                {profitTotal.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                MKD
                            </p>
                        </button>
                    )}

                    {userRole === 'admin' && (
                        <button
                            onClick={() => router.visit('/invoices')}
                            className="cursor-pointer rounded-xl border border-sidebar-border/70 bg-white p-6 text-left shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-lg dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        >
                            <p className="text-sm text-gray-500">Invoices</p>
                            <p className="mt-2 text-4xl font-bold">
                                {invoiceTotal.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                MKD
                            </p>
                        </button>
                    )}

                    {userRole === 'coach' && (
                        <button
                            onClick={() => setShowSalaryModal(true)}
                            className="cursor-pointer rounded-xl border border-sidebar-border/70 bg-white p-6 text-left shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-lg dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        >
                            <p className="text-sm text-gray-500">Salary</p>
                            <p className="mt-2 text-4xl font-bold">
                                {formatCurrency(coachSalaryTotal)} MKD
                            </p>
                        </button>
                    )}

                    <button
                        onClick={() => router.visit('/unpaid-fees')}
                        className="cursor-pointer rounded-xl border border-sidebar-border/70 bg-white p-6 text-left shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-lg dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <p className="text-sm text-gray-500">Unpaid Fees</p>
                        <p className="mt-2 text-4xl font-bold text-red-500">
                            {unpaidFees}
                        </p>
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <a
                        href="/members"
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <h2 className="text-lg font-semibold">Members</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Total active members: {activeMembers}
                        </p>
                    </a>

                    <a
                        href="/trainings"
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <h2 className="text-lg font-semibold">Trainings</h2>
                    </a>

                    <a
                        href="/membership-fees"
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <h2 className="text-lg font-semibold">
                            Membership Fees
                        </h2>
                    </a>
                    <a
                        href="/attendance"
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <h2 className="text-lg font-semibold">Attendance</h2>
                    </a>

                    {userRole === 'admin' && (
                        <a
                            href="/staff"
                            className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        >
                            <h2 className="text-lg font-semibold">Staff</h2>
                        </a>
                    )}
                </div>
            </div>

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
                        bgcolor: DARK_BG,
                    },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Salary
                        </Typography>
                        <IconButton
                            onClick={() => setShowSalaryModal(false)}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
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
                                                bgcolor:
                                                    'rgba(255,255,255,0.05)',
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
                                                    bgcolor:
                                                        'rgba(255,255,255,0.05)',
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
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Salary History By Month
                        </Typography>
                        <IconButton
                            onClick={() => setShowSalaryHistoryModal(false)}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
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
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Salary History - {selectedSalaryYear}
                        </Typography>
                        <IconButton
                            onClick={() => {
                                setShowSalaryYearDetailModal(false);
                                setSelectedSalaryYear(null);
                            }}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
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
        </ThemeProvider>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
