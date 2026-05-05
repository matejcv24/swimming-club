import { Head, router } from '@inertiajs/react';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ApiValidationError, apiRequest } from '@/lib/api';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';

interface Invoice {
    id: number;
    month: string;
    pool: 'big' | 'small';
    amount: number;
}

interface GroupedInvoiceByMonth {
    month: string;
    big_pool: number;
    small_pool: number;
    total: number;
}

interface Props {
    invoices?: Invoice[];
}

interface ListInvoicesResponse {
    invoices: Invoice[];
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

const chipSx = {
    minWidth: '180px',
    display: 'flex',
    justifyContent: 'center',
};

const inputSx = {
    color: 'white',
    '&::before': { borderBottomColor: 'white' },
    '&::after': { borderBottomColor: 'white' },
    '& input::placeholder': { color: 'rgba(255,255,255,0.5)' },
};

const datePickerSx = {
    '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
        '&:hover fieldset': { borderColor: 'white' },
        '&.Mui-focused fieldset': { borderColor: 'white' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
    '& .MuiInputBase-input': { color: 'white' },
    '& .MuiSvgIcon-root': { color: 'white' },
};

export default function InvoicesIndex({ invoices = [] }: Props) {
    const [invoiceList, setInvoiceList] = useState<Invoice[]>(
        invoices.map((inv) => ({
            ...inv,
            amount:
                typeof inv.amount === 'string'
                    ? parseFloat(inv.amount)
                    : inv.amount,
        })),
    );
    const [invoiceMonth, setInvoiceMonth] = useState<Dayjs | null>(null);
    const [invoicePool, setInvoicePool] = useState<'big' | 'small'>('big');
    const [invoiceAmount, setInvoiceAmount] = useState('');
    const [showYearDetailModal, setShowYearDetailModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editPoolSelection, setEditPoolSelection] = useState<'big' | 'small'>(
        'big',
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
    const [invoiceError, setInvoiceError] = useState<string | null>(null);
    const [invoiceErrors, setInvoiceErrors] = useState<
        Record<string, string[]>
    >({});
    const [editError, setEditError] = useState<string | null>(null);
    const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const loadInvoices = async () => {
            setIsLoadingInvoices(true);
            setInvoiceError(null);

            try {
                const data =
                    await apiRequest<ListInvoicesResponse>('/api/invoices');

                setInvoiceList(
                    data.invoices.map((invoice) => ({
                        ...invoice,
                        amount: Number(invoice.amount),
                    })),
                );
            } catch {
                setInvoiceError('Unable to refresh invoices right now.');
            } finally {
                setIsLoadingInvoices(false);
            }
        };

        void loadInvoices();
    }, []);

    // Get unique months and group invoices
    const groupedInvoices: Record<string, GroupedInvoiceByMonth> = {};
    invoiceList.forEach((inv) => {
        if (!groupedInvoices[inv.month]) {
            groupedInvoices[inv.month] = {
                month: inv.month,
                big_pool: 0,
                small_pool: 0,
                total: 0,
            };
        }

        const amount =
            typeof inv.amount === 'string'
                ? parseFloat(inv.amount)
                : inv.amount;

        if (inv.pool === 'big') {
            groupedInvoices[inv.month].big_pool = amount;
        } else {
            groupedInvoices[inv.month].small_pool = amount;
        }

        groupedInvoices[inv.month].total =
            groupedInvoices[inv.month].big_pool +
            groupedInvoices[inv.month].small_pool;
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

    const handleSaveInvoice = async () => {
        if (!invoiceMonth || !invoiceAmount) {
            return;
        }

        setIsSaving(true);
        setInvoiceError(null);
        setInvoiceErrors({});

        const monthStr = invoiceMonth.format('YYYY-MM-DD');
        const amount = parseFloat(invoiceAmount);

        if (isNaN(amount) || amount < 0) {
            setIsSaving(false);

            return;
        }

        const payload = {
            month: monthStr,
            pool: invoicePool,
            amount: amount,
        };

        try {
            const data = await apiRequest<Invoice>('/api/invoices', {
                method: 'POST',
                body: payload,
            });

            const savedInvoice: Invoice = {
                id: data.id,
                month: data.month,
                pool: data.pool,
                amount: Number(data.amount),
            };

            setInvoiceList((currentInvoices) => {
                const invoiceExists = currentInvoices.some(
                    (invoice) => invoice.id === savedInvoice.id,
                );

                if (invoiceExists) {
                    return currentInvoices.map((invoice) =>
                        invoice.id === savedInvoice.id ? savedInvoice : invoice,
                    );
                }

                return [savedInvoice, ...currentInvoices];
            });
            setInvoiceMonth(null);
            setInvoicePool('big');
            setInvoiceAmount('');
        } catch (error) {
            if (error instanceof ApiValidationError) {
                setInvoiceErrors(error.errors);
                setInvoiceError(error.message);

                return;
            }

            setInvoiceError('Unable to save invoice. Please try again.');
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
            return;
        }

        setEditError(null);
        setEditErrors({});

        try {
            const updated = await apiRequest<Invoice>(
                `/api/invoices/${editingInvoice.id}`,
                {
                    method: 'PUT',
                    body: { amount: amount },
                },
            );

            const updatedInvoice: Invoice = {
                id: updated.id,
                month: updated.month,
                pool: updated.pool,
                amount: Number(updated.amount),
            };
            setInvoiceList((currentInvoices) =>
                currentInvoices.map((invoice) =>
                    invoice.id === updatedInvoice.id ? updatedInvoice : invoice,
                ),
            );
            setEditingInvoice(null);
            setEditAmount('');
            setEditPoolSelection('big');
        } catch (error) {
            if (error instanceof ApiValidationError) {
                setEditErrors(error.errors);
                setEditError(error.message);

                return;
            }

            setEditError('Unable to update invoice. Please try again.');
        }
    };

    const handleDeleteInvoice = async (id: number) => {
        try {
            await apiRequest<null>(`/api/invoices/${id}`, {
                method: 'DELETE',
            });

            setInvoiceList((currentInvoices) =>
                currentInvoices.filter((invoice) => invoice.id !== id),
            );
            setEditingInvoice(null);
            setEditAmount('');
        } catch {
            setEditError('Unable to delete invoice. Please try again.');
        }
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <Head title="Invoices" />

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
                            Invoices
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
                                    sx={datePickerSx}
                                />
                            </LocalizationProvider>
                            {invoiceErrors.month?.[0] && (
                                <Typography variant="caption" color="error">
                                    {invoiceErrors.month[0]}
                                </Typography>
                            )}

                            <FormControl variant="standard" fullWidth>
                                <InputLabel
                                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                                >
                                    Pool
                                </InputLabel>
                                <Select
                                    value={invoicePool}
                                    onChange={(e) =>
                                        setInvoicePool(
                                            e.target.value as 'big' | 'small',
                                        )
                                    }
                                    sx={{
                                        color: 'white',
                                        '&::before': {
                                            borderBottomColor: 'white',
                                        },
                                        '&::after': {
                                            borderBottomColor: 'white',
                                        },
                                    }}
                                >
                                    <MenuItem value="big">Big Pool</MenuItem>
                                    <MenuItem value="small">
                                        Small Pool
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            {invoiceErrors.pool?.[0] && (
                                <Typography variant="caption" color="error">
                                    {invoiceErrors.pool[0]}
                                </Typography>
                            )}

                            <Input
                                placeholder="Amount (MKD)"
                                type="number"
                                value={invoiceAmount}
                                onChange={(e) =>
                                    setInvoiceAmount(e.target.value)
                                }
                                fullWidth
                                inputProps={{
                                    'aria-label': 'invoice amount',
                                }}
                                sx={inputSx}
                            />
                            {invoiceErrors.amount?.[0] && (
                                <Typography variant="caption" color="error">
                                    {invoiceErrors.amount[0]}
                                </Typography>
                            )}
                            {invoiceError && (
                                <Typography variant="body2" color="error">
                                    {invoiceError}
                                </Typography>
                            )}

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
                                    onClick={() => {
                                        setInvoiceMonth(null);
                                        setInvoicePool('big');
                                        setInvoiceAmount('');
                                    }}
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

                            {isLoadingInvoices ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Loading invoices...
                                </Typography>
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
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Invoice History By Month - {selectedYear}
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
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setEditPoolSelection('big');
                                                const bigInvoice =
                                                    invoiceList.find(
                                                        (i) =>
                                                            i.month === month &&
                                                            i.pool === 'big',
                                                    );

                                                if (bigInvoice) {
                                                    setEditingInvoice(
                                                        bigInvoice,
                                                    );
                                                    setEditAmount(
                                                        String(
                                                            bigInvoice.amount,
                                                        ),
                                                    );
                                                }
                                            }}
                                        >
                                            <EditIcon
                                                fontSize="small"
                                                sx={{ color: '#2196F3' }}
                                            />
                                        </IconButton>
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
                                            label={`Big: ${formatCurrency(monthData.big_pool)} MKD`}
                                            size="small"
                                            sx={{
                                                ...chipSx,
                                                bgcolor:
                                                    'rgba(33, 150, 243, 0.3)',
                                            }}
                                        />
                                        <Chip
                                            label={`Small: ${formatCurrency(monthData.small_pool)} MKD`}
                                            size="small"
                                            sx={{
                                                ...chipSx,
                                                bgcolor:
                                                    'rgba(76, 175, 80, 0.3)',
                                            }}
                                        />
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
                        setEditPoolSelection('big');
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
                                Edit Invoice
                            </Typography>
                            <IconButton
                                onClick={() => {
                                    setEditingInvoice(null);
                                    setEditAmount('');
                                    setEditPoolSelection('big');
                                }}
                                color="error"
                            >
                                <CloseIcon />
                            </IconButton>
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
                                <FormControl
                                    variant="standard"
                                    sx={{ minWidth: 120 }}
                                >
                                    <InputLabel
                                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                                    >
                                        Select Pool
                                    </InputLabel>
                                    <Select
                                        value={editPoolSelection}
                                        onChange={(e) => {
                                            const newPool = e.target.value as
                                                | 'big'
                                                | 'small';
                                            setEditPoolSelection(newPool);
                                            const invoice = invoiceList.find(
                                                (i) =>
                                                    i.month ===
                                                        editingInvoice.month &&
                                                    i.pool === newPool,
                                            );

                                            if (invoice) {
                                                setEditingInvoice(invoice);
                                                setEditAmount(
                                                    String(invoice.amount),
                                                );
                                            }
                                        }}
                                        sx={{
                                            color: 'white',
                                            '&::before': {
                                                borderBottomColor: 'white',
                                            },
                                            '&::after': {
                                                borderBottomColor: 'white',
                                            },
                                        }}
                                    >
                                        <MenuItem value="big">
                                            Big Pool
                                        </MenuItem>
                                        <MenuItem value="small">
                                            Small Pool
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </div>

                            <Input
                                placeholder="Amount (MKD)"
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                fullWidth
                                inputProps={{
                                    'aria-label': 'invoice amount',
                                }}
                                sx={inputSx}
                            />
                            {editErrors.amount?.[0] && (
                                <Typography variant="caption" color="error">
                                    {editErrors.amount[0]}
                                </Typography>
                            )}
                            {editError && (
                                <Typography variant="body2" color="error">
                                    {editError}
                                </Typography>
                            )}

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
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    color="error"
                                    onClick={() =>
                                        handleDeleteInvoice(editingInvoice.id)
                                    }
                                >
                                    Delete
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="medium"
                                    onClick={() => {
                                        setEditingInvoice(null);
                                        setEditAmount('');
                                        setEditPoolSelection('big');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </ThemeProvider>
    );
}
