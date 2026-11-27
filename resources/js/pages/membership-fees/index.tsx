import { Head, router } from '@inertiajs/react';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
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
import {
    ConfirmationPreviewDialog,
    PaymentSavedDialog,
} from '@/components/payment-saved-dialog';
import type { SavedFee } from '@/components/payment-saved-dialog';
import {
    CloseButton,
    Hint,
    PopupHeader,
    ShowHistoryButton,
} from '@/components/popup-ui';
import { CardsSkeleton } from '@/components/skeletons';
import { usePagePopup } from '@/hooks/use-page-popup';
import { groupNameOf, useGroups } from '@/lib/groups';
import { locale, pickerLocaleText, t, tc } from '@/lib/i18n';
import { clearOnClick } from '@/lib/search-field';

/** 'all' or one group's id */
type GroupFilter = 'all' | number;

interface Member {
    id: number;
    name: string;
    group_id: number | null;
    status: 'active' | 'inactive';
}

interface Fee {
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
    /** Arrives right after the page (undefined until then). */
    allFees?: Fee[];
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

/**
 * The member's name stays in place while a wide table is scrolled sideways (on
 * phones), on the pop-up's own background so the other columns pass under it.
 */
const STICKY_FIRST_COLUMN = {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    bgcolor: POPUP_BG,
    whiteSpace: 'nowrap',
    boxShadow: `1px 0 0 ${popupFg(0.12)}`,
} as const;

const methodLabel = (method: 'cash' | 'card') =>
    method === 'card' ? t('Card') : t('Cash');

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
            <Typography variant="caption" color="text.secondary">
                {methodLabel(fee.payment_method)}
            </Typography>
            {fee.confirmation_sent_at && (
                <Typography
                    variant="caption"
                    sx={{ color: 'success.main', lineHeight: 1.2 }}
                >
                    {t('Confirmation sent :date', {
                        date: dayjs(fee.confirmation_sent_at).format('DD.MM'),
                    })}
                </Typography>
            )}
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
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    // From the dashboard's "Add payment" quick action: just the payment form, and
    // saving or cancelling goes back to the dashboard
    const [openedToAdd] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('add') === '1',
    );
    const groups = useGroups();
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
    // The payment just saved (null: the "payment saved" pop-up is closed)
    const [savedFee, setSavedFee] = useState<SavedFee | null>(null);
    // The payment whose confirmation email is shown before sending
    const [previewFeeId, setPreviewFeeId] = useState<number | null>(null);
    // The preview was opened from the "payment saved" pop-up (not the history)
    const [previewFromSaved, setPreviewFromSaved] = useState(false);
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
    const [monthPoolFilter, setMonthPoolFilter] = useState<GroupFilter>('all');

    const groupedFeesByMonth = useMemo(() => {
        const grouped: Record<string, MonthGroup> = {};

        (allFees ?? []).forEach((fee) => {
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
            (fee) => fee.group_id === monthPoolFilter,
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

        // From a coach's payment notification: that payment's confirmation email,
        // ready to send (admins; once sent, just the history)
        const confirmFeeId = Number(params.get('confirm')) || null;

        if (notificationMember) {
            queueMicrotask(() => {
                void handleMemberSelect(notificationMember);
                setShowHistoryModal(true);

                if (confirmFeeId && userRole === 'admin') {
                    setPreviewFromSaved(false);
                    setPreviewFeeId(confirmFeeId);
                }
            });
        }
    }, [handleMemberSelect, members, userRole]);

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
                onSuccess: (page) => {
                    // "Payment saved", with the offer to email a confirmation
                    setSavedFee(
                        (page.props.feeSaved as SavedFee | null | undefined) ??
                            null,
                    );

                    if (openedToAdd) {
                        // The pop-up closes after the "payment saved" one
                        return;
                    }

                    handleMemberSelect(selectedMember);
                    setAmount('');
                    setPaymentMethod('cash');
                    setStartDate(null);
                    setEndDate(null);
                },
            },
        );
    };

    // Done with the new payment: back to the dashboard (its quick action) or the form
    const finishNewPayment = () => {
        if (openedToAdd) {
            popup.close();
        } else if (selectedMember) {
            // The history shows "confirmation sent" right away
            handleMemberSelect(selectedMember);
        }
    };

    // "Not now" / "Close": the payment stays saved
    const closeSaved = () => {
        setSavedFee(null);
        finishNewPayment();
    };

    const openPreviewFromSaved = (feeId: number) => {
        setSavedFee(null);
        setPreviewFromSaved(true);
        setPreviewFeeId(feeId);
    };

    const closePreview = () => {
        setPreviewFeeId(null);

        if (previewFromSaved) {
            // Not sent after all: the payment itself is still saved
            setPreviewFromSaved(false);
            finishNewPayment();
        }
    };

    const confirmationSent = () => {
        setPreviewFeeId(null);

        if (previewFromSaved) {
            setPreviewFromSaved(false);
            finishNewPayment();
        } else if (selectedMember) {
            void handleMemberSelect(selectedMember);
        }
    };

    // Admins: delete a payment (asked first)
    const [deletingFee, setDeletingFee] = useState<Fee | null>(null);
    const [feeBusy, setFeeBusy] = useState(false);

    const refreshHistory = () => {
        if (selectedMember) {
            void handleMemberSelect(selectedMember);
        }
    };

    const deleteFee = () => {
        if (!deletingFee) {
            return;
        }

        setFeeBusy(true);
        router.delete(`/membership-fees/${deletingFee.id}`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setDeletingFee(null);
                refreshHistory();
            },
            onFinish: () => setFeeBusy(false),
        });
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
        if (openedToAdd) {
            popup.close();

            return;
        }

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
            <Head title={t('Membership Fees')} />

            <Dialog
                {...popup.dialogProps}
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
                        title={t('Membership Fees')}
                        subtitle={t('Record and review payments')}
                        onClose={popup.close}
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
                                    label={t('Search member')}
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
                                        {t('Last Payment — :name', {
                                            name: selectedMember.name,
                                        })}
                                    </Typography>

                                    {loadingFees ? (
                                        <CardsSkeleton cards={1} />
                                    ) : fees.length === 0 ? (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1 }}
                                        >
                                            {t('No payments recorded yet.')}
                                        </Typography>
                                    ) : (
                                        <>
                                            <List disablePadding sx={{ mt: 1 }}>
                                                <ListItem
                                                    sx={{
                                                        px: 0,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexWrap: 'nowrap',
                                                        justifyContent:
                                                            'space-between',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                    }}
                                                    onClick={() =>
                                                        setShowHistoryModal(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="body2">
                                                                {dayjs(
                                                                    fees[0]
                                                                        .start_date,
                                                                ).format(
                                                                    'DD.MM.YYYY',
                                                                )}{' '}
                                                                →{' '}
                                                                {dayjs(
                                                                    fees[0]
                                                                        .end_date,
                                                                ).format(
                                                                    'DD.MM.YYYY',
                                                                )}
                                                            </Typography>
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
                                            {/* The whole payment history opens from here */}
                                            {fees.length > 1 && (
                                                <div className="mt-2 flex justify-center">
                                                    <ShowHistoryButton
                                                        label={t(
                                                            'View all :count payments',
                                                            {
                                                                count: fees.length,
                                                            },
                                                        )}
                                                        onClick={() =>
                                                            setShowHistoryModal(
                                                                true,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </>
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
                            {t('Record New Payment')}
                        </Typography>

                        <div className="flex gap-3">
                            <TextField
                                label={t('Amount (MKD)')}
                                variant="outlined"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                sx={{ ...inputSx, flex: '1 1 0', minWidth: 0 }}
                            />
                            <FormControl
                                sx={{
                                    flex: '0 0 9rem',
                                    ...inputSx,
                                }}
                            >
                                <InputLabel id="payment-method-label">
                                    {t('Method')}
                                </InputLabel>
                                <Select
                                    labelId="payment-method-label"
                                    value={paymentMethod}
                                    label={t('Method')}
                                    onChange={(e) =>
                                        setPaymentMethod(
                                            e.target.value as 'cash' | 'card',
                                        )
                                    }
                                >
                                    <MenuItem value="cash">
                                        {t('Cash')}
                                    </MenuItem>
                                    <MenuItem value="card">
                                        {t('Card')}
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </div>

                        <LocalizationProvider
                            dateAdapter={AdapterDayjs}
                            adapterLocale={locale}
                            localeText={pickerLocaleText}
                        >
                            <DatePicker
                                label={t('Start Date')}
                                value={startDate}
                                onChange={(val) => setStartDate(val)}
                                sx={inputSx}
                                format="DD.MM.YYYY"
                            />
                            <DatePicker
                                label={t('End Date')}
                                value={endDate}
                                onChange={(val) => setEndDate(val)}
                                minDate={startDate ?? undefined}
                                sx={inputSx}
                                format="DD.MM.YYYY"
                            />
                        </LocalizationProvider>

                        <div className="flex gap-3">
                            <Button
                                variant="outlined"
                                fullWidth
                                size="medium"
                                onClick={handleCancel}
                            >
                                {t('Cancel')}
                            </Button>
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
                                {t('Save')}
                            </Button>
                        </div>

                        {/* The yearly history: not when only adding a payment */}
                        {!openedToAdd && <Divider />}

                        {userRole === 'admin' && !openedToAdd && (
                            <div className="flex flex-col gap-4">
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        textTransform: 'uppercase',
                                        letterSpacing: 1,
                                    }}
                                >
                                    {t('Membership Fees By Year')}
                                </Typography>

                                {allFees === undefined ? (
                                    <CardsSkeleton />
                                ) : sortedYears.length > 0 ? (
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
                                                        {tc(
                                                            ':count month|:count months',
                                                            yearGroups[year]
                                                                .monthCount,
                                                        )}
                                                    </Typography>
                                                </div>

                                                <Chip
                                                    label={t(
                                                        'Total: :amount MKD',
                                                        {
                                                            amount: formatCurrency(
                                                                yearGroups[year]
                                                                    .total,
                                                            ),
                                                        },
                                                    )}
                                                    color="success"
                                                    size="small"
                                                />
                                                {/* Says plainly that the whole history opens from here */}
                                                <ShowHistoryButton
                                                    label={t('View months')}
                                                    onClick={() => {
                                                        setSelectedYear(year);
                                                        setShowYearHistoryModal(
                                                            true,
                                                        );
                                                    }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {t('No membership fees recorded yet.')}
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
                            {t('Payment History — :name', {
                                name: selectedMember?.name ?? '',
                            })}
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
                                    secondary={
                                        // Admins: the "payment received" email, shown first
                                        userRole === 'admin' &&
                                        !fee.confirmation_sent_at ? (
                                            <Button
                                                size="small"
                                                variant="text"
                                                startIcon={
                                                    <EmailIcon fontSize="small" />
                                                }
                                                onClick={() => {
                                                    setPreviewFromSaved(false);
                                                    setPreviewFeeId(fee.id);
                                                }}
                                                sx={{
                                                    mt: 0.5,
                                                    ml: -0.75,
                                                    px: 0.75,
                                                    minHeight: 32,
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {t('Send confirmation')}
                                            </Button>
                                        ) : undefined
                                    }
                                    sx={{ flex: '1 1 auto', minWidth: 0 }}
                                />
                                <div className="flex flex-none items-center gap-1">
                                    <PaymentMethodBadge fee={fee} />
                                    {userRole === 'admin' && (
                                        <div className="flex flex-col gap-2">
                                            <Hint title={t('Edit payment')}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() =>
                                                        handleEditFeeOpen(fee)
                                                    }
                                                    aria-label={t(
                                                        'Edit payment',
                                                    )}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Hint>
                                            <Hint title={t('Delete payment')}>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() =>
                                                        setDeletingFee(fee)
                                                    }
                                                    aria-label={t(
                                                        'Delete payment',
                                                    )}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Hint>
                                        </div>
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
                                {t('Edit Payment — :name', {
                                    name: selectedMember?.name ?? '',
                                })}
                            </Typography>
                            <CloseButton onClick={handleEditFeeClose} />
                        </div>
                        <Divider />
                    </DialogTitle>

                    <DialogContent>
                        <div className="flex flex-col gap-6 py-4">
                            <div className="flex gap-3">
                                <TextField
                                    label={t('Amount (MKD)')}
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
                                    sx={{
                                        ...inputSx,
                                        flex: '1 1 0',
                                        minWidth: 0,
                                    }}
                                />
                                <FormControl
                                    sx={{
                                        flex: '0 0 9rem',
                                        ...inputSx,
                                    }}
                                >
                                    <InputLabel id="edit-payment-method-label">
                                        {t('Method')}
                                    </InputLabel>
                                    <Select
                                        labelId="edit-payment-method-label"
                                        value={editFeeForm.payment_method}
                                        label={t('Method')}
                                        onChange={(e) =>
                                            setEditFeeForm({
                                                ...editFeeForm,
                                                payment_method: e.target
                                                    .value as 'cash' | 'card',
                                            })
                                        }
                                    >
                                        <MenuItem value="cash">
                                            {t('Cash')}
                                        </MenuItem>
                                        <MenuItem value="card">
                                            {t('Card')}
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </div>

                            <LocalizationProvider
                                dateAdapter={AdapterDayjs}
                                adapterLocale={locale}
                                localeText={pickerLocaleText}
                            >
                                <DatePicker
                                    label={t('Start Date')}
                                    value={editFeeForm.start_date}
                                    onChange={(val) =>
                                        setEditFeeForm({
                                            ...editFeeForm,
                                            start_date: val,
                                        })
                                    }
                                    sx={inputSx}
                                    format="DD.MM.YYYY"
                                />
                                <DatePicker
                                    label={t('End Date')}
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
                                    format="DD.MM.YYYY"
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
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    onClick={handleEditFeeClose}
                                >
                                    {t('Cancel')}
                                </Button>
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
                                    {t('Save')}
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
                            {t('Membership Fees - :year', {
                                year: selectedYear ?? '',
                            })}
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
                                            {tc(
                                                ':count payment|:count payments',
                                                monthData.fees.length,
                                            )}
                                        </Typography>
                                    </div>

                                    <Chip
                                        label={t('Total: :amount MKD', {
                                            amount: formatCurrency(
                                                monthData.total,
                                            ),
                                        })}
                                        color="success"
                                        size="small"
                                    />
                                    <ShowHistoryButton
                                        label={t('View payments')}
                                        onClick={() => {
                                            setSelectedMonth(month);
                                            setMonthPoolFilter('all');
                                            setShowMonthDetailModal(true);
                                        }}
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
                            {t('Membership Details — :month', {
                                month: selectedMonth
                                    ? dayjs(selectedMonth).format('MMMM YYYY')
                                    : '',
                            })}
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
                                {t('Group')}
                            </InputLabel>
                            <Select
                                labelId="month-pool-filter-label"
                                value={monthPoolFilter}
                                label={t('Group')}
                                onChange={(e) =>
                                    setMonthPoolFilter(
                                        e.target.value === 'all'
                                            ? 'all'
                                            : Number(e.target.value),
                                    )
                                }
                            >
                                <MenuItem value="all">{t('All')}</MenuItem>
                                {groups.map((group) => (
                                    <MenuItem key={group.id} value={group.id}>
                                        {group.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label={t('Paid Memberships')}
                            value={filteredSelectedMonthFees.length}
                            InputProps={{ readOnly: true }}
                            sx={inputSx}
                        />
                        <TextField
                            label={t('Total Value')}
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
                                            ...STICKY_FIRST_COLUMN,
                                        }}
                                    >
                                        {t('Member')}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: POPUP_FG,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {t('Group')}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: POPUP_FG,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {t('Start Date')}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: POPUP_FG,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {t('End Date')}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: POPUP_FG,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {t('Amount')}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            color: POPUP_FG,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {t('Method')}
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
                                            {t(
                                                'No payments recorded for this group.',
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredSelectedMonthFees.map((fee) => (
                                    <TableRow key={fee.id}>
                                        <TableCell
                                            sx={{
                                                color: POPUP_FG,
                                                fontWeight: 600,
                                                ...STICKY_FIRST_COLUMN,
                                            }}
                                        >
                                            {fee.member?.name ??
                                                fee.member_name ??
                                                '—'}
                                        </TableCell>
                                        <TableCell sx={{ color: POPUP_FG }}>
                                            {groupNameOf(
                                                groups,
                                                fee.group_id,
                                                fee.group?.name,
                                            )}
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
                                            }}
                                        >
                                            {methodLabel(fee.payment_method)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
            </Dialog>
            <PaymentSavedDialog
                fee={savedFee}
                canSend={userRole === 'admin'}
                onClose={closeSaved}
                onSend={openPreviewFromSaved}
            />

            {/* The confirmation email as it will be sent: Cancel, or Send */}
            {userRole === 'admin' && (
                <ConfirmationPreviewDialog
                    feeId={previewFeeId}
                    onClose={closePreview}
                    onSent={confirmationSent}
                />
            )}

            {/* Deleting a payment: asked once */}
            {userRole === 'admin' && (
                <Dialog
                    open={!!deletingFee}
                    onClose={() => !feeBusy && setDeletingFee(null)}
                    disableRestoreFocus
                    fullWidth
                    maxWidth="xs"
                    PaperProps={{ sx: { bgcolor: POPUP_BG } }}
                >
                    <DialogTitle sx={{ p: 0 }}>
                        <div className="flex items-center justify-between px-4 py-3">
                            <Typography variant="h6" fontWeight="bold">
                                {t('Delete payment')}
                            </Typography>
                            <CloseButton onClick={() => setDeletingFee(null)} />
                        </div>
                        <Divider />
                    </DialogTitle>
                    <DialogContent>
                        <div className="flex flex-col gap-4 py-4">
                            {deletingFee && (
                                <Typography variant="body1">
                                    {t(
                                        'Delete the payment of :amount MKD for :from – :to?',
                                        {
                                            amount: formatCurrency(
                                                Number(deletingFee.amount),
                                            ),
                                            from: dayjs(
                                                deletingFee.start_date,
                                            ).format('DD.MM.YYYY'),
                                            to: dayjs(
                                                deletingFee.end_date,
                                            ).format('DD.MM.YYYY'),
                                        },
                                    )}
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                                {t(
                                    'Only for a payment entered by mistake: profit and reports will no longer count it. This cannot be undone.',
                                )}
                            </Typography>
                            <div className="flex gap-3">
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => setDeletingFee(null)}
                                    disabled={feeBusy}
                                >
                                    {t('Cancel')}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    fullWidth
                                    onClick={deleteFee}
                                    disabled={feeBusy}
                                >
                                    {t('Delete')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </MuiThemeProvider>
    );
}
