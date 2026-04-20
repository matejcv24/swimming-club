import { Head, router } from '@inertiajs/react';
import CloseIcon from '@mui/icons-material/Close';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';

interface Member {
    id: number;
    name: string;
    pool: string;
}

interface Fee {
    id: number;
    member_id: number;
    amount: number;
    payment_method: 'cash' | 'card';
    start_date: string;
    end_date: string;
    member?: {
        id: number;
        name: string;
    };
}

interface YearGroup {
    year: string;
    total: number;
    monthCount: number;
}

interface MonthGroup {
    month: string;
    total: number;
    fees: Fee[];
}

interface Props {
    members: Member[];
    allFees: Fee[];
}

const darkTheme = createTheme({
    palette: { mode: 'dark' },
});

const DARK_BG = '#1d232a';

const inputSx = {
    '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
        '&:hover fieldset': { borderColor: 'white' },
        '&.Mui-focused fieldset': { borderColor: 'white' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
    '& .MuiInputBase-input': { color: 'white' },
    '& .MuiSvgIcon-root': { color: 'white' },
};

function PaymentMethodBadge({ fee }: { fee: Fee }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
            }}
        >
            <Chip
                label={`${Number(fee.amount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })} MKD`}
                color="success"
                size="small"
            />
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: 'capitalize' }}
            >
                {fee.payment_method}
            </Typography>
        </div>
    );
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function MembershipFeesIndex({ members, allFees }: Props) {
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [fees, setFees] = useState<Fee[]>([]);
    const [loadingFees, setLoadingFees] = useState(false);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [startDate, setStartDate] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const [showYearHistoryModal, setShowYearHistoryModal] = useState(false);
    const [showMonthDetailModal, setShowMonthDetailModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const groupedFeesByMonth = useMemo(() => {
        const grouped: Record<string, MonthGroup> = {};

        allFees.forEach((fee) => {
            const monthKey = dayjs(fee.start_date)
                .startOf('month')
                .format('YYYY-MM-DD');

            if (!grouped[monthKey]) {
                grouped[monthKey] = {
                    month: monthKey,
                    total: 0,
                    fees: [],
                };
            }

            grouped[monthKey].total += Number(fee.amount);
            grouped[monthKey].fees.push(fee);
        });

        return grouped;
    }, [allFees]);

    const sortedMonths = useMemo(
        () => Object.keys(groupedFeesByMonth).sort().reverse(),
        [groupedFeesByMonth],
    );

    const yearGroups = useMemo(() => {
        const grouped: Record<string, YearGroup> = {};

        Object.values(groupedFeesByMonth).forEach((monthData) => {
            const year = dayjs(monthData.month).format('YYYY');

            if (!grouped[year]) {
                grouped[year] = {
                    year,
                    total: 0,
                    monthCount: 0,
                };
            }

            grouped[year].total += monthData.total;
            grouped[year].monthCount += 1;
        });

        return grouped;
    }, [groupedFeesByMonth]);

    const sortedYears = useMemo(
        () => Object.keys(yearGroups).sort().reverse(),
        [yearGroups],
    );

    const yearMonths = selectedYear
        ? sortedMonths.filter(
              (month) => dayjs(month).format('YYYY') === selectedYear,
          )
        : [];

    const selectedMonthData = selectedMonth
        ? groupedFeesByMonth[selectedMonth]
        : null;

    const handleMemberSelect = async (member: Member | null) => {
        setSelectedMember(member);
        setFees([]);

        if (!member) {
            return;
        }

        setLoadingFees(true);

        try {
            const response = await fetch(
                `/membership-fees/by-member/${member.id}`,
            );
            const data = await response.json();
            setFees(data.fees ?? []);
        } catch {
            setFees([]);
        }

        setLoadingFees(false);
    };

    const handleSave = () => {
        if (!selectedMember || !startDate || !endDate) {
            return;
        }

        router.post(
            '/membership-fees',
            {
                member_id: selectedMember.id,
                amount: amount,
                payment_method: paymentMethod,
                start_date: startDate.format('YYYY-MM-DD'),
                end_date: endDate.format('YYYY-MM-DD'),
            },
            {
                onSuccess: () => {
                    handleMemberSelect(selectedMember);
                    setAmount('');
                    setPaymentMethod('cash');
                    setStartDate(null);
                    setEndDate(null);
                },
            },
        );
    };

    const handleCancel = () => {
        setSelectedMember(null);
        setFees([]);
        setAmount('');
        setPaymentMethod('cash');
        setStartDate(null);
        setEndDate(null);
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <Head title="Membership Fees" />

            <Dialog
                open={true}
                onClose={() => router.visit('/dashboard')}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: DARK_BG,
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Membership Fees
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

                <DialogContent sx={{ overflowY: 'auto' }}>
                    <div className="flex flex-col gap-6 py-4">
                        <Autocomplete
                            options={members}
                            getOptionLabel={(m) => m.name}
                            value={selectedMember}
                            onChange={(_, val) => handleMemberSelect(val)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Search member"
                                    variant="outlined"
                                    sx={inputSx}
                                />
                            )}
                        />

                        {selectedMember && (
                            <>
                                <div>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            textTransform: 'uppercase',
                                            letterSpacing: 1,
                                        }}
                                    >
                                        Last Payment — {selectedMember.name}
                                    </Typography>

                                    {loadingFees ? (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1 }}
                                        >
                                            Loading...
                                        </Typography>
                                    ) : fees.length === 0 ? (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1 }}
                                        >
                                            No payments recorded yet.
                                        </Typography>
                                    ) : (
                                        <List disablePadding sx={{ mt: 1 }}>
                                            <ListItem
                                                divider
                                                sx={{
                                                    px: 0,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    justifyContent:
                                                        'space-between',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                }}
                                                onClick={() =>
                                                    setShowHistoryModal(true)
                                                }
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2">
                                                            {dayjs(
                                                                fees[0]
                                                                    .start_date,
                                                            ).format(
                                                                'DD MMM YYYY',
                                                            )}{' '}
                                                            →{' '}
                                                            {dayjs(
                                                                fees[0]
                                                                    .end_date,
                                                            ).format(
                                                                'DD MMM YYYY',
                                                            )}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        fees.length > 1 ? (
                                                            <Typography
                                                                variant="caption"
                                                                color="primary"
                                                            >
                                                                Click to see all{' '}
                                                                {fees.length}{' '}
                                                                payments
                                                            </Typography>
                                                        ) : null
                                                    }
                                                    sx={{
                                                        flex: '1 1 auto',
                                                        minWidth: 0,
                                                    }}
                                                />
                                                <PaymentMethodBadge
                                                    fee={fees[0]}
                                                />
                                            </ListItem>
                                        </List>
                                    )}
                                </div>
                                <Divider />
                            </>
                        )}

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}
                        >
                            Record New Payment
                        </Typography>

                        <div className="flex gap-3">
                            <TextField
                                label="Amount (MKD)"
                                variant="outlined"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                sx={{ ...inputSx, flex: '0 0 65%' }}
                            />
                            <FormControl
                                sx={{
                                    flex: '0 0 calc(35% - 12px)',
                                    ...inputSx,
                                }}
                            >
                                <InputLabel id="payment-method-label">
                                    Method
                                </InputLabel>
                                <Select
                                    labelId="payment-method-label"
                                    value={paymentMethod}
                                    label="Method"
                                    onChange={(e) =>
                                        setPaymentMethod(
                                            e.target.value as 'cash' | 'card',
                                        )
                                    }
                                >
                                    <MenuItem value="cash">Cash</MenuItem>
                                    <MenuItem value="card">Card</MenuItem>
                                </Select>
                            </FormControl>
                        </div>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={(val) => setStartDate(val)}
                                sx={inputSx}
                                format="DD/MM/YYYY"
                            />
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={(val) => setEndDate(val)}
                                minDate={startDate ?? undefined}
                                sx={inputSx}
                                format="DD/MM/YYYY"
                            />
                        </LocalizationProvider>

                        <div className="flex gap-3">
                            <Button
                                variant="contained"
                                fullWidth
                                size="medium"
                                onClick={handleSave}
                                disabled={
                                    !selectedMember ||
                                    !amount ||
                                    !startDate ||
                                    !endDate
                                }
                            >
                                Save
                            </Button>
                            <Button
                                variant="outlined"
                                fullWidth
                                size="medium"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
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
                                Membership Fees By Year
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
                                                setShowYearHistoryModal(true);
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
                                                label={`Total: ${formatCurrency(yearGroups[year].total)} MKD`}
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
                                    No membership fees recorded yet.
                                </Typography>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Payment History — {selectedMember?.name}
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
                        {fees.map((fee) => (
                            <ListItem
                                key={fee.id}
                                divider
                                sx={{
                                    px: 2,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Typography variant="body2">
                                            {dayjs(fee.start_date).format(
                                                'DD MMM YYYY',
                                            )}{' '}
                                            →{' '}
                                            {dayjs(fee.end_date).format(
                                                'DD MMM YYYY',
                                            )}
                                        </Typography>
                                    }
                                    sx={{ flex: '1 1 auto', minWidth: 0 }}
                                />
                                <PaymentMethodBadge fee={fee} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showYearHistoryModal}
                onClose={() => {
                    setShowYearHistoryModal(false);
                    setSelectedYear(null);
                }}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Membership Fees - {selectedYear}
                        </Typography>
                        <IconButton
                            onClick={() => {
                                setShowYearHistoryModal(false);
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
                            const monthData = groupedFeesByMonth[month];

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
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                        },
                                    }}
                                    onClick={() => {
                                        setSelectedMonth(month);
                                        setShowMonthDetailModal(true);
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
                                            {dayjs(month).format('MMMM YYYY')}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="primary"
                                        >
                                            {monthData.fees.length} payments
                                        </Typography>
                                    </div>

                                    <Chip
                                        label={`Total: ${formatCurrency(monthData.total)} MKD`}
                                        color="success"
                                        size="small"
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showMonthDetailModal}
                onClose={() => {
                    setShowMonthDetailModal(false);
                    setSelectedMonth(null);
                }}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Membership Details —{' '}
                            {selectedMonth
                                ? dayjs(selectedMonth).format('MMMM YYYY')
                                : ''}
                        </Typography>
                        <IconButton
                            onClick={() => {
                                setShowMonthDetailModal(false);
                                setSelectedMonth(null);
                            }}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: 'white' }}>
                                        Member
                                    </TableCell>
                                    <TableCell sx={{ color: 'white' }}>
                                        Start Date
                                    </TableCell>
                                    <TableCell sx={{ color: 'white' }}>
                                        End Date
                                    </TableCell>
                                    <TableCell sx={{ color: 'white' }}>
                                        Amount
                                    </TableCell>
                                    <TableCell sx={{ color: 'white' }}>
                                        Method
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {selectedMonthData?.fees.map((fee) => (
                                    <TableRow key={fee.id}>
                                        <TableCell sx={{ color: 'white' }}>
                                            {fee.member?.name ?? '—'}
                                        </TableCell>
                                        <TableCell sx={{ color: 'white' }}>
                                            {dayjs(fee.start_date).format(
                                                'DD.MM.YYYY',
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ color: 'white' }}>
                                            {dayjs(fee.end_date).format(
                                                'DD.MM.YYYY',
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ color: 'white' }}>
                                            {formatCurrency(Number(fee.amount))}{' '}
                                            MKD
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color: 'white',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {fee.payment_method}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
}
