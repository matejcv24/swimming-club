import { Head, usePage } from '@inertiajs/react';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import {
    MuiThemeProvider,
    POPUP_BG,
    POPUP_FG,
    popupFg,
} from '@/components/mui-theme-provider';
import { CloseButton, PopupHeader } from '@/components/popup-ui';
import { usePagePopup } from '@/hooks/use-page-popup';
import { groupNameOf, useGroups } from '@/lib/groups';

interface Invoice {
    id: number;
    month: string;
    // Optional: an invoice may be for one group or for no group in particular
    group_id: number | null;
    // The group as it was, so invoices of a deleted group keep its name
    group?: { id: number; name: string } | null;
    amount: number;
}

interface InvoicesByMonth {
    month: string;
    invoices: Invoice[];
    total: number;
}

const toInvoice = (raw: Invoice | Record<string, unknown>): Invoice => {
    const data = raw as Invoice & { amount: number | string };

    return {
        id: data.id,
        month: String(data.month).slice(0, 10),
        group_id: data.group_id ?? null,
        group: data.group ?? null,
        amount:
            typeof data.amount === 'string'
                ? parseFloat(data.amount)
                : data.amount,
    };
};

interface Props {
    invoices: Invoice[];
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
};

const chipSx = {
    minWidth: '180px',
    display: 'flex',
    justifyContent: 'center',
};

// Outlined fields with a floating label, as in the rest of the app
const fieldSx = {
    '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: popupFg(0.3) },
        '&:hover fieldset': { borderColor: POPUP_FG },
        '&.Mui-focused fieldset': { borderColor: POPUP_FG },
    },
    '& .MuiInputLabel-root': { color: popupFg(0.5) },
    '& .MuiInputBase-input': { color: POPUP_FG },
    '& .MuiSvgIcon-root': { color: POPUP_FG },
};

export default function InvoicesIndex({ invoices }: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    const page = usePage();
    const csrfToken = (page.props as any).csrf_token;

    console.log('Page props:', page.props);
    console.log('CSRF Token from props:', csrfToken);

    const groups = useGroups();
    const [invoiceList, setInvoiceList] = useState<Invoice[]>(
        invoices.map(toInvoice),
    );
    const [invoiceMonth, setInvoiceMonth] = useState<Dayjs | null>(null);
    // '' = no specific group (counts toward the total only)
    const [invoiceGroupId, setInvoiceGroupId] = useState<number | ''>('');
    const [invoiceAmount, setInvoiceAmount] = useState('');
    const [showYearDetailModal, setShowYearDetailModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const invoiceLabel = (invoice: Invoice) =>
        invoice.group_id === null
            ? 'No specific group'
            : groupNameOf(groups, invoice.group_id, invoice.group?.name);

    // Invoices per month: one line per group (or without one) and their total
    const groupedInvoices: Record<string, InvoicesByMonth> = {};
    invoiceList.forEach((inv) => {
        if (!groupedInvoices[inv.month]) {
            groupedInvoices[inv.month] = {
                month: inv.month,
                invoices: [],
                total: 0,
            };
        }

        groupedInvoices[inv.month].invoices.push(inv);
        groupedInvoices[inv.month].total += inv.amount;
    });

    const sortedMonths = Object.keys(groupedInvoices).sort().reverse();

    const yearGroups: Record<
        string,
        { year: string; total: number; monthCount: number }
    > = {};

    Object.values(groupedInvoices).forEach((monthData) => {
        const year = dayjs(monthData.month).format('YYYY');

        if (!yearGroups[year]) {
            yearGroups[year] = {
                year,
                total: 0,
                monthCount: 0,
            };
        }

        yearGroups[year].total += monthData.total;
        yearGroups[year].monthCount += 1;
    });
    const sortedYears = Object.keys(yearGroups).sort().reverse();

    const yearMonths = selectedYear
        ? sortedMonths.filter(
              (month) => dayjs(month).format('YYYY') === selectedYear,
          )
        : [];

    const resetForm = () => {
        setInvoiceMonth(null);
        setInvoiceGroupId('');
        setInvoiceAmount('');
    };

    const handleSaveInvoice = async () => {
        if (!invoiceMonth || !invoiceAmount || !csrfToken) {
            return;
        }

        const amount = parseFloat(invoiceAmount);

        if (isNaN(amount) || amount < 0) {
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch('/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    month: invoiceMonth.format('YYYY-MM-DD'),
                    group_id: invoiceGroupId === '' ? null : invoiceGroupId,
                    amount,
                }),
            });

            if (response.ok) {
                const saved = toInvoice(await response.json());
                const group = groups.find((g) => g.id === saved.group_id);
                const withGroup = {
                    ...saved,
                    group: group ? { id: group.id, name: group.name } : null,
                };

                // The same month and group again updates that invoice, so replace it
                setInvoiceList((list) =>
                    list.some((inv) => inv.id === withGroup.id)
                        ? list.map((inv) =>
                              inv.id === withGroup.id ? withGroup : inv,
                          )
                        : [withGroup, ...list],
                );
                resetForm();
            } else {
                console.error('Error saving invoice', response.status);
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateInvoice = async () => {
        if (!editingInvoice || !editAmount) {
            return;
        }

        const amount = parseFloat(editAmount);

        if (isNaN(amount) || amount < 0) {
            console.error('Invalid amount');

            return;
        }

        try {
            const response = await fetch(`/invoices/${editingInvoice.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ amount: amount }),
            });

            if (response.ok) {
                const updatedInvoice: Invoice = {
                    ...editingInvoice,
                    amount: toInvoice(await response.json()).amount,
                };
                setInvoiceList(
                    invoiceList.map((inv) =>
                        inv.id === updatedInvoice.id ? updatedInvoice : inv,
                    ),
                );
                setEditingInvoice(null);
                setEditAmount('');
            } else {
                const errorData = await response.json();
                console.error('Error updating invoice:', errorData);
            }
        } catch (error) {
            console.error('Error updating invoice:', error);
        }
    };

    // The "are you sure" pop-up before deleting the invoice being edited
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deletingInvoice, setDeletingInvoice] = useState(false);

    const handleDeleteInvoice = async (id: number) => {
        setDeletingInvoice(true);

        try {
            const response = await fetch(`/invoices/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            if (response.ok) {
                setInvoiceList(invoiceList.filter((inv) => inv.id !== id));
                setConfirmDelete(false);
                setEditingInvoice(null);
                setEditAmount('');
            } else {
                console.error('Error deleting invoice');
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
        }

        setDeletingInvoice(false);
    };

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title="Invoices" />

            <Dialog
                {...popup.dialogProps}
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
                    <PopupHeader
                        icon={<ReceiptLongIcon fontSize="small" />}
                        title="Invoices"
                        subtitle="Invoices by month, per group or in total"
                        onClose={popup.close}
                    />
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    <div className="flex flex-col gap-6 p-4">
                        {/* Add Invoice Section */}
                        <div className="flex flex-col gap-4">
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                Record Invoice
                            </Typography>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Month"
                                    value={invoiceMonth}
                                    onChange={(val) => setInvoiceMonth(val)}
                                    views={['month', 'year']}
                                    sx={fieldSx}
                                />
                            </LocalizationProvider>

                            <FormControl fullWidth sx={fieldSx}>
                                <InputLabel id="invoice-group-label" shrink>
                                    Group (optional)
                                </InputLabel>
                                <Select
                                    labelId="invoice-group-label"
                                    label="Group (optional)"
                                    notched
                                    value={invoiceGroupId}
                                    displayEmpty
                                    onChange={(e) =>
                                        setInvoiceGroupId(
                                            String(e.target.value) === ''
                                                ? ''
                                                : Number(e.target.value),
                                        )
                                    }
                                >
                                    <MenuItem value="">
                                        No specific group (total)
                                    </MenuItem>
                                    {groups.map((group) => (
                                        <MenuItem
                                            key={group.id}
                                            value={group.id}
                                        >
                                            {group.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Amount (MKD)"
                                type="number"
                                required
                                value={invoiceAmount}
                                onChange={(e) =>
                                    setInvoiceAmount(e.target.value)
                                }
                                fullWidth
                                inputProps={{ min: 0 }}
                                sx={fieldSx}
                            />

                            <div className="flex gap-3">
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="medium"
                                    onClick={handleSaveInvoice}
                                    disabled={
                                        !invoiceAmount ||
                                        !invoiceMonth ||
                                        isSaving
                                    }
                                >
                                    {isSaving ? 'Saving...' : 'Save Invoice'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </Button>
                            </div>
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
                                Invoice History By Year
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
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Chip
                                                    label={`Total: ${formatCurrency(yearGroups[year].total)} MKD`}
                                                    color="success"
                                                    size="small"
                                                    sx={chipSx}
                                                />
                                            </div>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No invoices recorded yet.
                                </Typography>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Year Invoice History Modal */}
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
                    sx: { bgcolor: POPUP_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Invoice History By Month - {selectedYear}
                        </Typography>
                        <CloseButton
                            onClick={() => {
                                setShowYearDetailModal(false);
                                setSelectedYear(null);
                            }}
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    <List disablePadding>
                        {yearMonths.map((month) => {
                            const monthData = groupedInvoices[month];

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
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {monthData.invoices.map(
                                            (invoice, index) => (
                                                <Chip
                                                    key={invoice.id}
                                                    label={`${invoiceLabel(invoice)}: ${formatCurrency(invoice.amount)} MKD`}
                                                    size="small"
                                                    onClick={() => {
                                                        setEditingInvoice(
                                                            invoice,
                                                        );
                                                        setEditAmount(
                                                            String(
                                                                invoice.amount,
                                                            ),
                                                        );
                                                    }}
                                                    onDelete={() => {
                                                        setEditingInvoice(
                                                            invoice,
                                                        );
                                                        setEditAmount(
                                                            String(
                                                                invoice.amount,
                                                            ),
                                                        );
                                                    }}
                                                    deleteIcon={
                                                        <EditIcon
                                                            aria-label={`Edit ${invoiceLabel(invoice)} invoice`}
                                                        />
                                                    }
                                                    sx={{
                                                        ...chipSx,
                                                        bgcolor:
                                                            index % 2 === 0
                                                                ? 'rgba(33, 150, 243, 0.3)'
                                                                : 'rgba(76, 175, 80, 0.3)',
                                                    }}
                                                />
                                            ),
                                        )}
                                        <Chip
                                            label={`Total: ${formatCurrency(monthData.total)} MKD`}
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

            {/* Edit Invoice Modal */}
            {editingInvoice && (
                <Dialog
                    open={!!editingInvoice}
                    onClose={() => {
                        setEditingInvoice(null);
                        setEditAmount('');
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
                                Edit Invoice
                            </Typography>
                            <CloseButton
                                onClick={() => {
                                    setEditingInvoice(null);
                                    setEditAmount('');
                                }}
                            />
                        </div>
                        <Divider />
                    </DialogTitle>

                    <DialogContent>
                        <div className="flex flex-col gap-6 py-4">
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '16px',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {dayjs(editingInvoice.month).format(
                                        'MMMM YYYY',
                                    )}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    {invoiceLabel(editingInvoice)}
                                </Typography>
                            </div>

                            <TextField
                                label="Amount (MKD)"
                                type="number"
                                required
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                fullWidth
                                inputProps={{ min: 0 }}
                                sx={fieldSx}
                            />

                            <div className="flex gap-3">
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="medium"
                                    onClick={handleUpdateInvoice}
                                    disabled={!editAmount}
                                >
                                    Update
                                </Button>
                                {/* Asks first (Delete Invoice pop-up below) */}
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="medium"
                                    color="error"
                                    onClick={() => setConfirmDelete(true)}
                                >
                                    Delete
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="medium"
                                    onClick={() => {
                                        setEditingInvoice(null);
                                        setEditAmount('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Invoice Confirmation Modal (like Delete Member) */}
            <Dialog
                open={confirmDelete && !!editingInvoice}
                onClose={() => !deletingInvoice && setConfirmDelete(false)}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{
                    sx: { bgcolor: POPUP_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Delete Invoice
                        </Typography>
                        <CloseButton
                            onClick={() =>
                                !deletingInvoice && setConfirmDelete(false)
                            }
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent>
                    {editingInvoice && (
                        <div className="flex flex-col gap-4 py-4">
                            <Typography variant="body1">
                                Are you sure you want to delete the invoice{' '}
                                <strong>{invoiceLabel(editingInvoice)}</strong>{' '}
                                for{' '}
                                <strong>
                                    {dayjs(editingInvoice.month).format(
                                        'MMMM YYYY',
                                    )}
                                </strong>
                                ?
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                This cannot be undone.
                            </Typography>
                            <div className="flex gap-3">
                                <Button
                                    variant="contained"
                                    color="error"
                                    fullWidth
                                    size="medium"
                                    onClick={() =>
                                        handleDeleteInvoice(editingInvoice.id)
                                    }
                                    disabled={deletingInvoice}
                                >
                                    Yes
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    onClick={() => setConfirmDelete(false)}
                                    disabled={deletingInvoice}
                                >
                                    No
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
}
