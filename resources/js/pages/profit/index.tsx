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
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useState } from 'react';

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

const darkTheme = createTheme({
    palette: { mode: 'dark' },
});

const DARK_BG = '#1d232a';

const chipSx = {
    minWidth: '220px',
    display: 'flex',
    justifyContent: 'center',
};

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function ProfitIndex({ profits }: Props) {
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showYearDetailModal, setShowYearDetailModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);

    const groupedProfits: Record<string, ProfitRow> = {};
    profits.forEach((row) => {
        groupedProfits[row.month] = row;
    });

    const sortedMonths = Object.keys(groupedProfits).sort().reverse();
    const currentYear = dayjs().format('YYYY');

    const currentYearMonths = sortedMonths.filter(
        (month) => dayjs(month).format('YYYY') === currentYear,
    );

    const currentYearLastMonth = currentYearMonths[0];
    const currentYearLastProfit = currentYearLastMonth
        ? groupedProfits[currentYearLastMonth]
        : null;

    const yearGroups: Record<
        string,
        { year: string; total: number; monthCount: number }
    > = {};

    Object.values(groupedProfits).forEach((monthData) => {
        const year = dayjs(monthData.month).format('YYYY');

        if (!yearGroups[year]) {
            yearGroups[year] = {
                year,
                total: 0,
                monthCount: 0,
            };
        }

        yearGroups[year].total += monthData.profit;
        yearGroups[year].monthCount += 1;
    });

    const sortedYears = Object.keys(yearGroups)
        .filter((year) => year !== currentYear)
        .sort()
        .reverse();

    const yearMonths = selectedYear
        ? sortedMonths.filter(
              (month) => dayjs(month).format('YYYY') === selectedYear,
          )
        : [];

    return (
        <ThemeProvider theme={darkTheme}>
            <Head title="Profit" />

            <Dialog
                open={true}
                onClose={() => router.visit('/dashboard')}
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
                <DialogTitle sx={{ p: 0, fontWeight: 'bold' }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Profit
                        </Typography>
                        <IconButton
                            onClick={() => router.visit('/dashboard')}
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
                                Profit History By Month
                            </Typography>

                            {currentYearLastProfit ? (
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
                                            setShowHistoryModal(true)
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
                                                    currentYearLastProfit.month,
                                                ).format('MMMM YYYY')}
                                            </Typography>
                                            {currentYearMonths.length > 1 && (
                                                <Typography
                                                    variant="caption"
                                                    color="primary"
                                                >
                                                    {currentYearMonths.length}{' '}
                                                    months
                                                </Typography>
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Chip
                                                label={`Memberships: ${formatCurrency(currentYearLastProfit.memberships)} MKD`}
                                                size="small"
                                                sx={{
                                                    ...chipSx,
                                                    bgcolor:
                                                        'rgba(33, 150, 243, 0.3)',
                                                }}
                                            />
                                            <Chip
                                                label={`Salaries: ${formatCurrency(currentYearLastProfit.salaries)} MKD`}
                                                size="small"
                                                sx={{
                                                    ...chipSx,
                                                    bgcolor:
                                                        'rgba(244, 67, 54, 0.3)',
                                                }}
                                            />
                                            <Chip
                                                label={`Invoices: ${formatCurrency(currentYearLastProfit.invoices)} MKD`}
                                                size="small"
                                                sx={{
                                                    ...chipSx,
                                                    bgcolor:
                                                        'rgba(255, 152, 0, 0.3)',
                                                }}
                                            />
                                            <Chip
                                                label={`Profit: ${formatCurrency(currentYearLastProfit.profit)} MKD`}
                                                color="success"
                                                size="small"
                                                sx={chipSx}
                                            />
                                        </div>
                                    </ListItem>
                                </List>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No profit recorded for {currentYear}.
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
                                Profit History By Year
                            </Typography>

                            {sortedYears.length > 0 ? (
                                <List disablePadding>
                                    {sortedYears.map((year) => (
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
                                                setSelectedYear(year);
                                                setShowYearDetailModal(true);
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
                                                        yearGroups[year]
                                                            .monthCount
                                                    }{' '}
                                                    months
                                                </Typography>
                                            </div>

                                            <Chip
                                                label={`Profit: ${formatCurrency(yearGroups[year].total)} MKD`}
                                                color="success"
                                                size="small"
                                                sx={chipSx}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No past-year profit history yet.
                                </Typography>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
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
                            Profit History By Month
                        </Typography>
                        <IconButton
                            onClick={() => setShowHistoryModal(false)}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    <List disablePadding>
                        {currentYearMonths.map((month) => {
                            const monthData = groupedProfits[month];

                            return (
                                <ListItem
                                    key={month}
                                    divider
                                    sx={{
                                        px: 2,
                                        py: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: 'auto',
                                        gap: 2,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="body2">
                                        {dayjs(month).format('MMMM YYYY')}
                                    </Typography>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Chip
                                            label={`Memberships: ${formatCurrency(monthData.memberships)} MKD`}
                                            size="small"
                                            sx={{
                                                ...chipSx,
                                                bgcolor:
                                                    'rgba(33, 150, 243, 0.3)',
                                            }}
                                        />
                                        <Chip
                                            label={`Salaries: ${formatCurrency(monthData.salaries)} MKD`}
                                            size="small"
                                            sx={{
                                                ...chipSx,
                                                bgcolor:
                                                    'rgba(244, 67, 54, 0.3)',
                                            }}
                                        />
                                        <Chip
                                            label={`Invoices: ${formatCurrency(monthData.invoices)} MKD`}
                                            size="small"
                                            sx={{
                                                ...chipSx,
                                                bgcolor:
                                                    'rgba(255, 152, 0, 0.3)',
                                            }}
                                        />
                                        <Chip
                                            label={`Profit: ${formatCurrency(monthData.profit)} MKD`}
                                            color="success"
                                            size="small"
                                            sx={chipSx}
                                        />
                                    </div>
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showYearDetailModal}
                onClose={() => {
                    setShowYearDetailModal(false);
                    setSelectedYear(null);
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
                            Profit History - {selectedYear}
                        </Typography>
                        <IconButton
                            onClick={() => {
                                setShowYearDetailModal(false);
                                setSelectedYear(null);
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
                        {yearMonths.map((month) => {
                            const monthData = groupedProfits[month];

                            return (
                                <ListItem
                                    key={month}
                                    divider
                                    sx={{
                                        px: 2,
                                        py: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: 'auto',
                                        gap: 2,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="body2">
                                        {dayjs(month).format('MMMM YYYY')}
                                    </Typography>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Chip
                                            label={`Memberships: ${formatCurrency(monthData.memberships)} MKD`}
                                            size="small"
                                            sx={{
                                                ...chipSx,
                                                bgcolor:
                                                    'rgba(33, 150, 243, 0.3)',
                                            }}
                                        />
                                        <Chip
                                            label={`Salaries: ${formatCurrency(monthData.salaries)} MKD`}
                                            size="small"
                                            sx={{
                                                ...chipSx,
                                                bgcolor:
                                                    'rgba(244, 67, 54, 0.3)',
                                            }}
                                        />
                                        <Chip
                                            label={`Invoices: ${formatCurrency(monthData.invoices)} MKD`}
                                            size="small"
                                            sx={{
                                                ...chipSx,
                                                bgcolor:
                                                    'rgba(255, 152, 0, 0.3)',
                                            }}
                                        />
                                        <Chip
                                            label={`Profit: ${formatCurrency(monthData.profit)} MKD`}
                                            color="success"
                                            size="small"
                                            sx={chipSx}
                                        />
                                    </div>
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
}
