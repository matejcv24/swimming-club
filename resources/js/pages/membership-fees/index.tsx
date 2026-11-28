import { Head, router, usePage } from '@inertiajs/react';
import AddIcon from '@mui/icons-material/Add';
import AddCardIcon from '@mui/icons-material/AddCard';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import HistoryIcon from '@mui/icons-material/History';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
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
    formatCurrency,
    methodLabel,
    PaymentHistoryContent,
    period,
} from '@/components/payment-history';
import type { Fee } from '@/components/payment-history';
import { ConfirmationDialog } from '@/components/payment-saved-dialog';
import type {
    ConfirmationPayment,
    SavedFee,
} from '@/components/payment-saved-dialog';
import {
    ActionMenu,
    AddButton,
    ConfirmDialog,
    DrillRow,
    EmptyState,
    Note,
    PillSearchField,
    PopupHeader,
    SectionLabel,
    SelectClear,
    SummaryCard,
} from '@/components/popup-ui';
import { CardsSkeleton } from '@/components/skeletons';
import { usePagePopup } from '@/hooks/use-page-popup';
import { groupNameOf, useGroups } from '@/lib/groups';
import { locale, pickerLocaleText, t, tc } from '@/lib/i18n';
import { clearOnClick } from '@/lib/search-field';
import { showToast } from '@/lib/toast';
import type { ClubSharedData } from '@/types/club';

/** 'all' or one group's id */
type GroupFilter = 'all' | number;

interface Member {
    id: number;
    name: string;
    group_id: number | null;
    status: 'active' | 'inactive';
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

/** A payment as the confirmation pop-up shows it. */
const toPayment = (fee: Fee, member: string): ConfirmationPayment => ({
    id: fee.id,
    member,
    amount: Number(fee.amount),
    payment_method: fee.payment_method,
    start_date: fee.start_date,
    end_date: fee.end_date,
});

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
    // The "Add payment" form: from the quick action, the "+" of this window or
    // the "+" of a member's history (where it goes back to afterwards)
    const [addMode, setAddMode] = useState(openedToAdd);
    const [addFrom, setAddFrom] = useState<'overview' | 'history' | null>(null);
    const groups = useGroups();
    // The club may have switched confirmation emails off (Club settings)
    const { club } = usePage().props as { club: ClubSharedData | null };
    const confirmationsOn = club?.payment_confirmation_emails ?? true;
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
    // The confirmation pop-up: the payment, and whether it was just saved
    const [confirmFor, setConfirmFor] = useState<{
        payment: ConfirmationPayment;
        saved: boolean;
    } | null>(null);
    // The payment whose actions (send, edit, delete) are open
    const [actionsFee, setActionsFee] = useState<Fee | null>(null);
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
    const [monthSearch, setMonthSearch] = useState('');

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

    // The month's payments, narrowed by a member's name
    const searchedMonthFees = filteredSelectedMonthFees.filter((fee) =>
        (fee.member?.name ?? fee.member_name ?? '')
            .toLowerCase()
            .includes(monthSearch.trim().toLowerCase()),
    );

    const handleMemberSelect = useCallback(
        async (member: Member | null, confirmFeeId: number | null = null) => {
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
                const loaded: Fee[] = data.fees ?? [];
                setFees(loaded);

                // From a coach's payment notification: that payment's confirmation
                const fee = confirmFeeId
                    ? loaded.find((item) => item.id === confirmFeeId)
                    : null;

                if (fee) {
                    setConfirmFor({
                        payment: toPayment(fee, member.name),
                        saved: false,
                    });
                }
            } catch {
                setFees([]);
            }

            setLoadingFees(false);
        },
        [],
    );

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const memberId = params.get('member');
        const shouldOpenHistory = params.get('history') === '1';

        if (!memberId || (!shouldOpenHistory && !openedToAdd)) {
            return;
        }

        const notificationMember = members.find(
            (member) => member.id === Number(memberId),
        );

        // "+" in a member's history (from their card): the form, member picked
        if (notificationMember && openedToAdd && !shouldOpenHistory) {
            queueMicrotask(() => void handleMemberSelect(notificationMember));

            return;
        }

        // From a coach's payment notification: that payment's confirmation email,
        // ready to send (admins; once sent, just the history)
        const confirmFeeId = Number(params.get('confirm')) || null;

        if (notificationMember) {
            queueMicrotask(() => {
                void handleMemberSelect(
                    notificationMember,
                    userRole === 'admin' ? confirmFeeId : null,
                );
                setShowHistoryModal(true);
            });
        }
    }, [handleMemberSelect, members, userRole, openedToAdd]);

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
                    // "Payment saved", with the confirmation email ready to send
                    const saved = page.props.feeSaved as
                        | SavedFee
                        | null
                        | undefined;

                    if (saved?.auto_sent) {
                        // Already emailed by itself: just say so
                        showToast(
                            t('The confirmation was sent to :email', {
                                email: saved.email ?? '',
                            }),
                            'sent',
                        );
                        finishNewPayment();
                    } else if (saved) {
                        setConfirmFor({
                            payment: {
                                id: saved.id,
                                member: saved.member,
                                amount: saved.amount,
                                payment_method: saved.payment_method,
                                start_date: saved.start_date,
                                end_date: saved.end_date,
                            },
                            saved: true,
                        });
                    }

                    // Otherwise the confirmation pop-up is next; closing it finishes
                },
            },
        );
    };

    const resetForm = () => {
        setAmount('');
        setPaymentMethod('cash');
        setStartDate(null);
        setEndDate(null);
    };

    // The quick action (or a member's card) opened only the form: back there
    const leaveAdd = () => {
        const params = new URLSearchParams(window.location.search);

        if (params.get('from') === 'members' && params.get('member')) {
            router.visit(`/members?member=${params.get('member')}`, {
                preserveScroll: true,
            });
        } else {
            popup.close();
        }
    };

    // The form from this window's "+" (none picked yet) or a history's "+"
    const openAdd = (from: 'overview' | 'history') => {
        resetForm();
        setAddFrom(from);
        setShowHistoryModal(false);
        setAddMode(true);
    };

    // Leaving the form: back to where it was opened from
    const closeAdd = () => {
        resetForm();
        setAddMode(false);

        if (addFrom === 'history') {
            setShowHistoryModal(true);
        }

        setAddFrom(null);
    };

    // Done with the new payment: back to where the form was opened from
    const finishNewPayment = () => {
        if (openedToAdd) {
            leaveAdd();

            return;
        }

        if (selectedMember) {
            // The history shows the new payment (and "confirmation sent") at once
            void handleMemberSelect(selectedMember);
        }

        closeAdd();
    };

    // The confirmation pop-up closed (sent or not)
    const closeConfirmation = () => {
        const wasSaved = confirmFor?.saved ?? false;
        setConfirmFor(null);

        if (wasSaved) {
            finishNewPayment();
        } else if (selectedMember) {
            // The history shows "confirmation sent" right away
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
                showToast(t('The payment was deleted'), 'deleted');
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
                    showToast(t('The payment was changed'));

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
            leaveAdd();

            return;
        }

        closeAdd();
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
                    {addMode ? (
                        <PopupHeader
                            icon={<AddCardIcon fontSize="small" />}
                            title={t('Add payment')}
                            subtitle={
                                selectedMember?.name ?? t('Choose the member')
                            }
                            onClose={handleCancel}
                        />
                    ) : (
                        <PopupHeader
                            icon={<CreditCardIcon fontSize="small" />}
                            title={t('Membership Fees')}
                            subtitle={t('Review payments')}
                            actions={
                                <AddButton
                                    label={t('Add payment')}
                                    icon={<AddIcon fontSize="small" />}
                                    onClick={() => openAdd('overview')}
                                />
                            }
                            onClose={popup.close}
                        />
                    )}
                </DialogTitle>

                <DialogContent sx={{ overflowY: 'auto', px: '18px' }}>
                    <div className="flex flex-col gap-6 py-4">
                        <Autocomplete
                            options={activeMembers}
                            getOptionLabel={(m) => m.name}
                            value={selectedMember}
                            onChange={(_, val) => handleMemberSelect(val)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={
                                        addMode
                                            ? t('Member')
                                            : t('Search member')
                                    }
                                    variant="outlined"
                                    sx={inputSx}
                                    {...clearOnClick(
                                        selectedMember !== null,
                                        () => handleMemberSelect(null),
                                    )}
                                />
                            )}
                        />

                        {selectedMember && !addMode && (
                            <div className="flex flex-col gap-2">
                                <SectionLabel>{t('Last payment')}</SectionLabel>
                                {loadingFees ? (
                                    <CardsSkeleton cards={1} />
                                ) : fees.length === 0 ? (
                                    <p className="text-sm text-[var(--popup-muted)]">
                                        {t('No payments recorded yet.')}
                                    </p>
                                ) : (
                                    <ul className="-mx-[18px] border-t border-[var(--popup-border)]">
                                        {/* The whole payment history opens from here */}
                                        <DrillRow
                                            title={period(fees[0])}
                                            subtitle={tc(
                                                ':count payment|:count payments',
                                                fees.length,
                                            )}
                                            value={`${formatCurrency(Number(fees[0].amount))} MKD`}
                                            valueClassName="text-green-600 dark:text-green-400"
                                            onClick={() =>
                                                setShowHistoryModal(true)
                                            }
                                        />
                                    </ul>
                                )}
                            </div>
                        )}

                        {addMode && (
                            <>
                                <div className="flex gap-3">
                                    <TextField
                                        label={t('Amount (MKD)')}
                                        variant="outlined"
                                        type="number"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(e.target.value)
                                        }
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
                                        <InputLabel id="payment-method-label">
                                            {t('Method')}
                                        </InputLabel>
                                        <Select
                                            labelId="payment-method-label"
                                            value={paymentMethod}
                                            label={t('Method')}
                                            onChange={(e) =>
                                                setPaymentMethod(
                                                    e.target.value as
                                                        | 'cash'
                                                        | 'card',
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
                            </>
                        )}

                        {/* The yearly overview: admins, not while adding */}
                        {userRole === 'admin' && !addMode && (
                            <div className="flex flex-col gap-2">
                                <SectionLabel>
                                    {t('Membership Fees By Year')}
                                </SectionLabel>

                                {allFees === undefined ? (
                                    <CardsSkeleton />
                                ) : sortedYears.length > 0 ? (
                                    <ul className="-mx-[18px] border-t border-[var(--popup-border)]">
                                        {sortedYears.map((year) => (
                                            <DrillRow
                                                key={year}
                                                title={year}
                                                subtitle={tc(
                                                    ':count month|:count months',
                                                    yearGroups[year].monthCount,
                                                )}
                                                value={`${formatCurrency(yearGroups[year].total)} MKD`}
                                                valueClassName="text-green-600 dark:text-green-400"
                                                onClick={() => {
                                                    setSelectedYear(year);
                                                    setShowYearHistoryModal(
                                                        true,
                                                    );
                                                }}
                                            />
                                        ))}
                                    </ul>
                                ) : (
                                    <EmptyState
                                        icon={<CreditCardIcon />}
                                        title={t(
                                            'No membership fees recorded yet.',
                                        )}
                                    />
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
                <PopupHeader
                    icon={<HistoryIcon fontSize="small" />}
                    title={t('Payment history')}
                    subtitle={selectedMember?.name ?? ''}
                    actions={
                        <AddButton
                            label={t('Add payment')}
                            icon={<AddIcon fontSize="small" />}
                            onClick={() => openAdd('history')}
                        />
                    }
                    onClose={() => setShowHistoryModal(false)}
                />

                <DialogContent sx={{ p: 0 }}>
                    <PaymentHistoryContent
                        fees={fees}
                        loading={loadingFees}
                        onOpen={
                            userRole === 'admin'
                                ? (fee) => setActionsFee(fee)
                                : undefined
                        }
                    />
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
                    <PopupHeader
                        icon={<EditIcon fontSize="small" />}
                        title={t('Edit payment')}
                        subtitle={selectedMember?.name ?? ''}
                        onClose={handleEditFeeClose}
                    />

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
                <PopupHeader
                    icon={<CreditCardIcon fontSize="small" />}
                    title={t('Membership Fees')}
                    subtitle={t(':year · by month', {
                        year: selectedYear ?? '',
                    })}
                    onClose={() => {
                        setShowYearHistoryModal(false);
                        setSelectedYear(null);
                    }}
                />

                <DialogContent sx={{ p: 0 }}>
                    {selectedYear && yearGroups[selectedYear] && (
                        <SummaryCard
                            tone="green"
                            title={`${selectedYear}: ${formatCurrency(yearGroups[selectedYear].total)} MKD`}
                        >
                            {tc(
                                ':count month|:count months',
                                yearGroups[selectedYear].monthCount,
                            )}{' '}
                            ·{' '}
                            {tc(
                                ':count payment|:count payments',
                                yearMonths.reduce(
                                    (count, month) =>
                                        count +
                                        groupedFeesByMonth[month].fees.length,
                                    0,
                                ),
                            )}
                        </SummaryCard>
                    )}
                    <ul className="border-t border-[var(--popup-border)]">
                        {yearMonths.map((month) => {
                            const monthData = groupedFeesByMonth[month];

                            return (
                                <DrillRow
                                    key={month}
                                    title={dayjs(month).format('MMMM YYYY')}
                                    subtitle={tc(
                                        ':count payment|:count payments',
                                        monthData.fees.length,
                                    )}
                                    value={`${formatCurrency(monthData.total)} MKD`}
                                    valueClassName="text-green-600 dark:text-green-400"
                                    onClick={() => {
                                        setSelectedMonth(month);
                                        setMonthPoolFilter('all');
                                        setShowMonthDetailModal(true);
                                    }}
                                />
                            );
                        })}
                    </ul>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showMonthDetailModal}
                onClose={() => {
                    setShowMonthDetailModal(false);
                    setSelectedMonth(null);
                    setMonthPoolFilter('all');
                    setMonthSearch('');
                }}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                // A fixed height, like every window with a search: searching
                // changes the list, not the size of the window
                PaperProps={{
                    sx: {
                        bgcolor: POPUP_BG,
                        height: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <PopupHeader
                    icon={<CreditCardIcon fontSize="small" />}
                    title={t('Membership Fees')}
                    subtitle={
                        selectedMonth
                            ? dayjs(selectedMonth).format('MMMM YYYY')
                            : ''
                    }
                    onClose={() => {
                        setShowMonthDetailModal(false);
                        setSelectedMonth(null);
                        setMonthPoolFilter('all');
                        setMonthSearch('');
                    }}
                />

                {/* The group and the search stay in place; the payments scroll */}
                <div className="flex-none">
                    {/* Room above the field for its label, which sits on the border */}
                    <div className="px-[18px] pt-3 pb-3">
                        <FormControl fullWidth size="small" sx={inputSx}>
                            <InputLabel id="month-pool-filter-label">
                                {t('Group')}
                            </InputLabel>
                            <Select
                                labelId="month-pool-filter-label"
                                value={monthPoolFilter}
                                endAdornment={
                                    monthPoolFilter !== 'all' ? (
                                        <SelectClear
                                            onClear={() =>
                                                setMonthPoolFilter('all')
                                            }
                                        />
                                    ) : undefined
                                }
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
                    </div>
                    <div className="pb-3">
                        <PillSearchField
                            value={monthSearch}
                            onChange={setMonthSearch}
                            placeholder={t('Search members...')}
                        />
                    </div>
                </div>

                <DialogContent sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
                    <SummaryCard
                        tone="green"
                        title={`${formatCurrency(filteredSelectedMonthTotal)} MKD`}
                    >
                        {tc(
                            ':count payment|:count payments',
                            filteredSelectedMonthFees.length,
                        )}
                    </SummaryCard>
                    {filteredSelectedMonthFees.length === 0 ? (
                        <EmptyState
                            icon={<CreditCardIcon />}
                            title={t('No payments recorded for this group.')}
                        />
                    ) : searchedMonthFees.length === 0 ? (
                        <p className="py-8 text-center text-sm text-[var(--popup-muted)]">
                            {t('No members match your search.')}
                        </p>
                    ) : (
                        <ul className="border-t border-[var(--popup-border)]">
                            {searchedMonthFees.map((fee) => (
                                <li
                                    key={fee.id}
                                    className="flex items-center gap-3 border-b border-[var(--popup-border)] px-[18px] py-3"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[15px] font-semibold text-[var(--popup-fg)]">
                                            {fee.member?.name ??
                                                fee.member_name ??
                                                '—'}
                                        </span>
                                        <span className="block text-[13px] text-[var(--popup-muted)]">
                                            {period(fee)} ·{' '}
                                            {groupNameOf(
                                                groups,
                                                fee.group_id,
                                                fee.group?.name,
                                            )}
                                        </span>
                                    </span>
                                    <span className="flex-none text-right">
                                        <span className="block text-[15px] font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(Number(fee.amount))}{' '}
                                            MKD
                                        </span>
                                        <span className="block text-[13px] text-[var(--popup-muted)]">
                                            {methodLabel(fee.payment_method)}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </DialogContent>
            </Dialog>
            {/* One step: the payment, who the confirmation goes to, Send */}
            <ConfirmationDialog
                payment={confirmFor?.payment ?? null}
                saved={confirmFor?.saved ?? false}
                canSend={userRole === 'admin' && confirmationsOn}
                emailsOff={!confirmationsOn}
                onClose={closeConfirmation}
                onSent={closeConfirmation}
            />

            {/* One payment's actions (admins): send, edit, delete */}
            {userRole === 'admin' && (
                <ActionMenu
                    open={!!actionsFee}
                    title={
                        actionsFee
                            ? `${period(actionsFee)} · ${formatCurrency(Number(actionsFee.amount))} MKD`
                            : ''
                    }
                    subtitle={
                        actionsFee
                            ? methodLabel(actionsFee.payment_method)
                            : undefined
                    }
                    onClose={() => setActionsFee(null)}
                    actions={[
                        {
                            label: actionsFee?.confirmation_sent_at
                                ? t('Send the confirmation again')
                                : t('Send confirmation'),
                            icon: <EmailIcon fontSize="small" />,
                            tone: 'primary',
                            hidden: !confirmationsOn,
                            onClick: () => {
                                if (actionsFee) {
                                    setConfirmFor({
                                        payment: toPayment(
                                            actionsFee,
                                            selectedMember?.name ?? '',
                                        ),
                                        saved: false,
                                    });
                                }
                            },
                        },
                        {
                            label: t('Edit payment'),
                            icon: <EditIcon fontSize="small" />,
                            onClick: () =>
                                actionsFee && handleEditFeeOpen(actionsFee),
                        },
                        {
                            label: t('Delete payment'),
                            icon: <DeleteIcon fontSize="small" />,
                            tone: 'danger',
                            onClick: () => setDeletingFee(actionsFee),
                        },
                    ]}
                />
            )}

            {/* Deleting a payment: asked once */}
            {userRole === 'admin' && (
                <ConfirmDialog
                    open={!!deletingFee}
                    icon={<DeleteIcon fontSize="small" />}
                    title={t('Delete payment?')}
                    subtitle={
                        deletingFee
                            ? `${selectedMember?.name ?? ''} · ${formatCurrency(Number(deletingFee.amount))} MKD`
                            : undefined
                    }
                    confirmLabel={t('Delete')}
                    busy={feeBusy}
                    onConfirm={deleteFee}
                    onClose={() => setDeletingFee(null)}
                >
                    {deletingFee && <p>{period(deletingFee)}</p>}
                    <Note tone="error">
                        {t(
                            'Only for a payment entered by mistake: profit and reports will no longer count it. This cannot be undone.',
                        )}
                    </Note>
                </ConfirmDialog>
            )}
        </MuiThemeProvider>
    );
}
