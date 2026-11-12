import { Head, router } from '@inertiajs/react';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EditIcon from '@mui/icons-material/Edit';
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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import {
    MuiThemeProvider,
    POPUP_BG,
    POPUP_FG,
    popupFg,
} from '@/components/mui-theme-provider';
import { CloseButton, PopupHeader } from '@/components/popup-ui';
import { clearOnClick } from '@/lib/search-field';

type PoolFilter = 'all' | 'big' | 'small';

interface Member {
    id: number;
    name: string;
    pool: string;
    status: 'active' | 'inactive';
}

interface Fee {
    id: number;
    member_id: number;
    member_name?: string | null;
    pool: 'big' | 'small';
    amount: number;
    payment_method: 'cash' | 'card';
    start_date: string;
    end_date: string;
    member?: {
        id: number;
        name: string;
        pool: string;
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
    userRole: 'admin' | 'coach';
}

const inputSx = {
    '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: popupFg(0.3) },
        '&:hover fieldset': { borderColor: POPUP_FG },
        '&.Mui-focused fieldset': { borderColor: POPUP_FG },
    },
    '& .MuiInputLabel-root': { color: popupFg(0.5) },
    '& .MuiInputBase-input': { color: POPUP_FG },
    '& .MuiSvgIcon-root': { color: POPUP_FG },
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
                    minimumFractionDigits: 0,
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
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function MembershipFeesIndex({
    members,
    allFees,
    userRole,
}: Props) {
    const activeMembers = members.filter((m) => m.status === 'active');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [fees, setFees] = useState<Fee[]>([]);
    const [loadingFees, setLoadingFees] = useState(false);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [startDate, setStartDate] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [editingFee, setEditingFee] = useState<Fee | null>(null);
    const [editFeeForm, setEditFeeForm] = useState<{
        amount: string;
        payment_method: 'cash' | 'card';
        start_date: Dayjs | null;
        end_date: Dayjs | null;
    }>({
        amount: '',
        payment_method: 'cash',
        start_date: null,
        end_date: null,
    });
    const [editFeeErrors, setEditFeeErrors] = useState<Record<string, string>>(
        {},
    );

    const [showYearHistoryModal, setShowYearHistoryModal] = useState(false);
    const [showMonthDetailModal, setShowMonthDetailModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [monthPoolFilter, setMonthPoolFilter] = useState<PoolFilter>('all');

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

    const filteredSelectedMonthFees = useMemo(() => {
        if (!selectedMonthData) {
            return [];
        }

        if (monthPoolFilter === 'all') {
            return selectedMonthData.fees;
        }

        return selectedMonthData.fees.filter(
            (fee) => fee.pool === monthPoolFilter,
        );
    }, [monthPoolFilter, selectedMonthData]);

    const filteredSelectedMonthTotal = useMemo(
        () =>
            filteredSelectedMonthFees.reduce(
                (total, fee) => total + Number(fee.amount),
                0,
            ),
        [filteredSelectedMonthFees],
    );

    const handleMemberSelect = useCallback(async (member: Member | null) => {
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
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const memberId = params.get('member');
        const shouldOpenHistory = params.get('history') === '1';

        if (!memberId || !shouldOpenHistory) {
            return;
        }

        const notificationMember = members.find(
            (member) => member.id === Number(memberId),
        );

        if (notificationMember) {
            queueMicrotask(() => {
                void handleMemberSelect(notificationMember);
                setShowHistoryModal(true);
            });
        }
    }, [handleMemberSelect, members]);

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

    const handleEditFeeOpen = (fee: Fee) => {
        setEditingFee(fee);
        setEditFeeForm({
            amount: String(Number(fee.amount)),
            payment_method: fee.payment_method,
            start_date: dayjs(fee.start_date),
            end_date: dayjs(fee.end_date),
        });
        setEditFeeErrors({});
    };

    const handleEditFeeClose = () => {
        setEditingFee(null);
        setEditFeeErrors({});
    };

    const handleEditFeeSave = () => {
        if (!editingFee || !editFeeForm.start_date || !editFeeForm.end_date) {
            return;
        }

        router.put(
            `/membership-fees/${editingFee.id}`,
            {
                amount: editFeeForm.amount,
                payment_method: editFeeForm.payment_method,
                start_date: editFeeForm.start_date.format('YYYY-MM-DD'),
                end_date: editFeeForm.end_date.format('YYYY-MM-DD'),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    handleEditFeeClose();

                    if (selectedMember) {
                        void handleMemberSelect(selectedMember);
                    }
                },
                onError: (errors) => setEditFeeErrors(errors),
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
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title="Membership Fees" />

            <Dialog
                open={true}
                onClose={() => router.visit('/dashboard')}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: POPUP_BG,
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<CreditCardIcon fontSize="small" />}
                        title="Membership Fees"
                        subtitle="Record and review payments"
                        onClose={() => router.visit('/dashboard')}
                    />
                </DialogTitle>

                <DialogContent sx={{ overflowY: 'auto' }}>
                    <div className="flex flex-col gap-6 py-4">
                        <Autocomplete
                            options={activeMembers}
                            getOptionLabel={(m) => m.name}
                            value={selectedMember}
                            onChange={(_, val) => handleMemberSelect(val)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Search member"
                                    variant="outlined"
                                    sx={inputSx}
                                    {...clearOnClick(
                                        selectedMember !== null,
                                        () => handleMemberSelect(null),
                                    )}
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

                        {userRole === 'admin' && (
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
                                                        bgcolor: popupFg(0.05),
                                                    },
                                                }}
                                                onClick={() => {
                                                    setSelectedYear(year);
                                                    setShowYearHistoryModal(
                                                        true,
                                                    );
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'center',
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
                        )}
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
                    sx: { bgcolor: POPUP_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Payment History — {selectedMember?.name}
                        </Typography>
                        <CloseButton
                            onClick={() => setShowHistoryModal(false)}
                        />
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
                                    flexWrap: 'nowrap',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                {/* Start and end on their own lines, so long month
                                    names never push the amount and buttons around */}
                                <ListItemText
                                    primary={
                                        <Typography variant="body2">
                                            <span className="block">
                                                {dayjs(fee.start_date).format(
                                                    'DD MMMM YYYY',
                                                )}{' '}
                                                →
                                            </span>
                                            <span className="block">
                                                {dayjs(fee.end_date).format(
                                                    'DD MMMM YYYY',
                                                )}
                                            </span>
                                        </Typography>
                                    }
                                    sx={{ flex: '1 1 auto', minWidth: 0 }}
                                />
                                <div className="flex flex-none items-center gap-1">
                                    <PaymentMethodBadge fee={fee} />
                                    {userRole === 'admin' && (
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() =>
                                                handleEditFeeOpen(fee)
                                            }
                                            aria-label="edit payment"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </div>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>

            {userRole === 'admin' && (
                <Dialog
                    open={!!editingFee}
                    onClose={handleEditFeeClose}
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
                                Edit Payment — {selectedMember?.name}
                            </Typography>
                            <CloseButton onClick={handleEditFeeClose} />
                        </div>
                        <Divider />
                    </DialogTitle>

                    <DialogContent>
                        <div className="flex flex-col gap-6 py-4">
                            <div className="flex gap-3">
                                <TextField
                                    label="Amount (MKD)"
                                    variant="outlined"
                                    type="number"
                                    value={editFeeForm.amount}
                                    onChange={(e) =>
                                        setEditFeeForm({
                                            ...editFeeForm,
                                            amount: e.target.value,
                                        })
                                    }
                                    error={!!editFeeErrors.amount}
                                    sx={{ ...inputSx, flex: '0 0 65%' }}
                                />
                                <FormControl
                                    sx={{
                                        flex: '0 0 calc(35% - 12px)',
                                        ...inputSx,
                                    }}
                                >
                                    <InputLabel id="edit-payment-method-label">
                                        Method
                                    </InputLabel>
                                    <Select
                                        labelId="edit-payment-method-label"
                                        value={editFeeForm.payment_method}
                                        label="Method"
                                        onChange={(e) =>
                                            setEditFeeForm({
                                                ...editFeeForm,
                                                payment_method: e.target
                                                    .value as 'cash' | 'card',
                                            })
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
                                    value={editFeeForm.start_date}
                                    onChange={(val) =>
                                        setEditFeeForm({
                                            ...editFeeForm,
                                            start_date: val,
                                        })
                                    }
                                    sx={inputSx}
                                    format="DD/MM/YYYY"
                                />
                                <DatePicker
                                    label="End Date"
                                    value={editFeeForm.end_date}
                                    onChange={(val) =>
                                        setEditFeeForm({
                                            ...editFeeForm,
                                            end_date: val,
                                        })
                                    }
                                    minDate={
                                        editFeeForm.start_date ?? undefined
                                    }
                                    sx={inputSx}
                                    format="DD/MM/YYYY"
                                />
                            </LocalizationProvider>

                            {Object.values(editFeeErrors).map((message) => (
                                <Typography
                                    key={message}
                                    variant="body2"
                                    color="error"
                                    sx={{ mt: -3 }}
                                >
                                    {message}
                                </Typography>
                            ))}

                            <div className="flex gap-3">
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="medium"
                                    onClick={handleEditFeeSave}
                                    disabled={
                                        !editFeeForm.amount ||
                                        !editFeeForm.start_date ||
                                        !editFeeForm.end_date
                                    }
                                >
                                    Save
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    onClick={handleEditFeeClose}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <Dialog
                open={showYearHistoryModal}
                onClose={() => {
                    setShowYearHistoryModal(false);
                    setSelectedYear(null);
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
                            Membership Fees - {selectedYear}
                        </Typography>
                        <CloseButton
                            onClick={() => {
                                setShowYearHistoryModal(false);
                                setSelectedYear(null);
                            }}
                        />
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
                                            bgcolor: popupFg(0.05),
                                        },
                                    }}
                                    onClick={() => {
                                        setSelectedMonth(month);
                                        setMonthPoolFilter('all');
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
                    setMonthPoolFilter('all');
                }}
                disableRestoreFocus
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: { bgcolor: POPUP_BG },
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
                        <CloseButton
                            onClick={() => {
                                setShowMonthDetailModal(false);
                                setSelectedMonth(null);
                                setMonthPoolFilter('all');
                            }}
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    <div className="grid gap-3 px-4 py-3 sm:grid-cols-3">
                        <FormControl sx={inputSx}>
                            <InputLabel id="month-pool-filter-label">
                                Pool
                            </InputLabel>
                            <Select
                                labelId="month-pool-filter-label"
                                value={monthPoolFilter}
                                label="Pool"
                                onChange={(e) =>
                                    setMonthPoolFilter(
                                        e.target.value as PoolFilter,
                                    )
                                }
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="small">Small Pool</MenuItem>
                                <MenuItem value="big">Big Pool</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Paid Memberships"
                            value={filteredSelectedMonthFees.length}
                            InputProps={{ readOnly: true }}
                            sx={inputSx}
                        />
                        <TextField
                            label="Total Value"
                            value={`${formatCurrency(filteredSelectedMonthTotal)} MKD`}
                            InputProps={{ readOnly: true }}
                            sx={inputSx}
                        />
                    </div>
                    <Divider />
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            color: POPUP_FG,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Member
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: POPUP_FG,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Pool
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: POPUP_FG,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Start Date
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: POPUP_FG,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        End Date
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: POPUP_FG,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Amount
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: POPUP_FG,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Method
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredSelectedMonthFees.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            sx={{
                                                color: popupFg(0.7),
                                                textAlign: 'center',
                                                py: 4,
                                            }}
                                        >
                                            No payments recorded for this pool.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredSelectedMonthFees.map((fee) => (
                                    <TableRow key={fee.id}>
                                        <TableCell sx={{ color: POPUP_FG }}>
                                            {fee.member?.name ??
                                                fee.member_name ??
                                                '—'}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color: POPUP_FG,
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {fee.pool} pool
                                        </TableCell>
                                        <TableCell sx={{ color: POPUP_FG }}>
                                            {dayjs(fee.start_date).format(
                                                'DD.MM.YYYY',
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ color: POPUP_FG }}>
                                            {dayjs(fee.end_date).format(
                                                'DD.MM.YYYY',
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ color: POPUP_FG }}>
                                            {formatCurrency(Number(fee.amount))}{' '}
                                            MKD
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color: POPUP_FG,
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
        </MuiThemeProvider>
    );
}
