import { Head, usePage } from '@inertiajs/react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
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
import {
    ActionMenu,
    ConfirmDialog,
    DrillRow,
    EmptyState,
    Note,
    PopupButtons,
    PopupHeader,
    SectionLabel,
    SummaryCard,
} from '@/components/popup-ui';
import { usePagePopup } from '@/hooks/use-page-popup';
import { groupNameOf, useGroups } from '@/lib/groups';
import { locale, pickerLocaleText, t, tc } from '@/lib/i18n';
import { showToast } from '@/lib/toast';

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
            ? t('No specific group')
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
                showToast(
                    t('The invoice for :month was saved', {
                        month: invoiceMonth.format('MMMM'),
                    }),
                );
                resetForm();
            } else {
                showToast(t('The invoice was not saved. Try again.'), 'error');
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
                closeEdit();
                showToast(t('The invoice was changed'));
            } else {
                const errorData = await response.json();
                console.error('Error updating invoice:', errorData);
            }
        } catch (error) {
            console.error('Error updating invoice:', error);
        }
    };

    // The invoice whose actions are open, and the one asked about before deleting
    const [actionsFor, setActionsFor] = useState<Invoice | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
    const [deletingInvoice, setDeletingInvoice] = useState(false);

    const closeYear = () => {
        setShowYearDetailModal(false);
        setSelectedYear(null);
    };

    const closeEdit = () => {
        setEditingInvoice(null);
        setEditAmount('');
    };

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
                setDeleteTarget(null);
                showToast(t('The invoice was deleted'), 'deleted');
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
            <Head title={t('Invoices')} />

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
                <PopupHeader
                    icon={<ReceiptLongIcon fontSize="small" />}
                    title={t('Invoices')}
                    subtitle={t('Invoices by month, per group or in total')}
                    onClose={popup.close}
                />

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    <div className="flex flex-col gap-4 px-[18px] pt-1 pb-4">
                        <SectionLabel>{t('Record Invoice')}</SectionLabel>

                        <LocalizationProvider
                            dateAdapter={AdapterDayjs}
                            adapterLocale={locale}
                            localeText={pickerLocaleText}
                        >
                            <DatePicker
                                label={t('Month')}
                                value={invoiceMonth}
                                onChange={(val) => setInvoiceMonth(val)}
                                views={['month', 'year']}
                                sx={fieldSx}
                            />
                        </LocalizationProvider>

                        <FormControl fullWidth sx={fieldSx}>
                            <InputLabel id="invoice-group-label" shrink>
                                {t('Group (optional)')}
                            </InputLabel>
                            <Select
                                labelId="invoice-group-label"
                                label={t('Group (optional)')}
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
                                    {t('No specific group (total)')}
                                </MenuItem>
                                {groups.map((group) => (
                                    <MenuItem key={group.id} value={group.id}>
                                        {group.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label={t('Amount (MKD)')}
                            type="number"
                            required
                            value={invoiceAmount}
                            onChange={(e) => setInvoiceAmount(e.target.value)}
                            fullWidth
                            inputProps={{ min: 0 }}
                            sx={fieldSx}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outlined" onClick={resetForm}>
                                {t('Cancel')}
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSaveInvoice}
                                disabled={
                                    !invoiceAmount || !invoiceMonth || isSaving
                                }
                            >
                                {t('Save')}
                            </Button>
                        </div>

                        <SectionLabel>{t('Invoice History By Year')}</SectionLabel>
                    </div>

                    {sortedYears.length > 0 ? (
                        <ul className="border-t border-[var(--popup-border)]">
                            {sortedYears.map((year) => (
                                <DrillRow
                                    key={year}
                                    title={year}
                                    subtitle={tc(
                                        ':count month|:count months',
                                        yearGroups[year].monthCount,
                                    )}
                                    value={`${formatCurrency(yearGroups[year].total)} MKD`}
                                    onClick={() => {
                                        setSelectedYear(year);
                                        setShowYearDetailModal(true);
                                    }}
                                />
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            icon={<ReceiptLongIcon />}
                            title={t('No invoices recorded yet.')}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* One year: the total, then each invoice by month */}
            <Dialog
                open={showYearDetailModal}
                onClose={closeYear}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <PopupHeader
                    icon={<ReceiptLongIcon fontSize="small" />}
                    title={t('Invoices')}
                    subtitle={t(':year · by month', { year: selectedYear ?? '' })}
                    onClose={closeYear}
                />

                <DialogContent sx={{ p: 0 }}>
                    {selectedYear && yearGroups[selectedYear] && (
                        <SummaryCard
                            tone="blue"
                            title={`${selectedYear}: ${formatCurrency(yearGroups[selectedYear].total)} MKD`}
                        >
                            {tc(
                                ':count month|:count months',
                                yearGroups[selectedYear].monthCount,
                            )}{' '}
                            ·{' '}
                            {tc(
                                ':count invoice|:count invoices',
                                yearMonths.reduce(
                                    (count, month) =>
                                        count +
                                        groupedInvoices[month].invoices.length,
                                    0,
                                ),
                            )}
                        </SummaryCard>
                    )}
                    <ul className="border-t border-[var(--popup-border)]">
                        {yearMonths.flatMap((month) =>
                            groupedInvoices[month].invoices.map((invoice) => (
                                <li
                                    key={invoice.id}
                                    className="border-b border-[var(--popup-border)]"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActionsFor(invoice)}
                                        className="flex w-full cursor-pointer items-center gap-3 px-[18px] py-3 text-left transition hover:bg-[var(--popup-ghost)]"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[15px] font-semibold text-[var(--popup-fg)] capitalize">
                                                {dayjs(month).format(
                                                    'MMMM YYYY',
                                                )}
                                            </span>
                                            <span className="block text-[13px] text-[var(--popup-muted)]">
                                                {invoiceLabel(invoice)}
                                            </span>
                                        </span>
                                        <span className="flex-none text-[15px] font-bold whitespace-nowrap text-[var(--popup-fg)]">
                                            {formatCurrency(invoice.amount)} MKD
                                        </span>
                                        <MoreVertIcon
                                            fontSize="small"
                                            className="flex-none text-[var(--popup-muted)]"
                                        />
                                    </button>
                                </li>
                            )),
                        )}
                    </ul>
                </DialogContent>
            </Dialog>

            {/* One invoice's actions: edit, delete */}
            <ActionMenu
                open={!!actionsFor}
                title={
                    actionsFor
                        ? `${dayjs(actionsFor.month).format('MMMM YYYY')} · ${formatCurrency(actionsFor.amount)} MKD`
                        : ''
                }
                subtitle={actionsFor ? invoiceLabel(actionsFor) : undefined}
                onClose={() => setActionsFor(null)}
                actions={[
                    {
                        label: t('Edit invoice'),
                        icon: <EditIcon fontSize="small" />,
                        onClick: () => {
                            if (actionsFor) {
                                setEditingInvoice(actionsFor);
                                setEditAmount(String(actionsFor.amount));
                            }
                        },
                    },
                    {
                        label: t('Delete invoice'),
                        icon: <DeleteIcon fontSize="small" />,
                        tone: 'danger',
                        onClick: () => setDeleteTarget(actionsFor),
                    },
                ]}
            />

            {/* Edit Invoice Modal */}
            <Dialog
                open={!!editingInvoice}
                onClose={closeEdit}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <PopupHeader
                    icon={<EditIcon fontSize="small" />}
                    title={t('Edit invoice')}
                    subtitle={
                        editingInvoice
                            ? `${dayjs(editingInvoice.month).format('MMMM YYYY')} · ${invoiceLabel(editingInvoice)}`
                            : ''
                    }
                    onClose={closeEdit}
                />
                <div className="px-[18px] pt-2 pb-2">
                    <TextField
                        label={t('Amount (MKD)')}
                        type="number"
                        required
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        fullWidth
                        inputProps={{ min: 0 }}
                        sx={fieldSx}
                    />
                </div>
                <PopupButtons>
                    <Button variant="outlined" onClick={closeEdit}>
                        {t('Cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleUpdateInvoice}
                        disabled={!editAmount}
                    >
                        {t('Save')}
                    </Button>
                </PopupButtons>
            </Dialog>

            {/* Deleting an invoice: asked once */}
            <ConfirmDialog
                open={!!deleteTarget}
                icon={<DeleteIcon fontSize="small" />}
                title={t('Delete invoice?')}
                subtitle={
                    deleteTarget
                        ? `${invoiceLabel(deleteTarget)} · ${dayjs(deleteTarget.month).format('MMMM YYYY')}`
                        : undefined
                }
                confirmLabel={t('Delete')}
                busy={deletingInvoice}
                onConfirm={() =>
                    deleteTarget && handleDeleteInvoice(deleteTarget.id)
                }
                onClose={() => setDeleteTarget(null)}
            >
                <p>
                    {t(
                        'Profit and reports will no longer count it.',
                    )}
                </p>
                <Note tone="error">{t('This cannot be undone.')}</Note>
            </ConfirmDialog>
        </MuiThemeProvider>
    );
}
