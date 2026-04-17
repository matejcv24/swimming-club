import { Head, router, usePage } from '@inertiajs/react';
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
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';

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

export default function InvoicesIndex({ invoices }: Props) {
    const page = usePage();
    const csrfToken = (page.props as any).csrf_token;
    
    console.log('Page props:', page.props);
    console.log('CSRF Token from props:', csrfToken);
    
    const [invoiceList, setInvoiceList] = useState<Invoice[]>(
        invoices.map(inv => ({
            ...inv,
            amount: typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount,
        }))
    );
    const [invoiceMonth, setInvoiceMonth] = useState<Dayjs | null>(null);
    const [invoicePool, setInvoicePool] = useState<'big' | 'small'>('big');
    const [invoiceAmount, setInvoiceAmount] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editPoolSelection, setEditPoolSelection] = useState<'big' | 'small'>('big');
    const [isSaving, setIsSaving] = useState(false);

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

        const amount = typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount;

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
    const lastMonth = sortedMonths[0];
    const lastInvoice = lastMonth ? groupedInvoices[lastMonth] : null;

    const handleSaveInvoice = async () => {
        console.log('handleSaveInvoice called');
        console.log('Invoiced inputs - Month:', invoiceMonth?.format('YYYY-MM-DD'), 'Amount:', invoiceAmount, 'Pool:', invoicePool);
        console.log('CSRF Token available:', csrfToken);
        
        if (!invoiceMonth || !invoiceAmount) {
            console.log('Missing required fields');

            return;
        }

        if (!csrfToken) {
            console.error('CSRF token is missing!');

            return;
        }

        setIsSaving(true);

        const monthStr = invoiceMonth.format('YYYY-MM-DD');
        const amount = parseFloat(invoiceAmount);

        if (isNaN(amount) || amount < 0) {
            console.error('Invalid amount - NaN or negative');
            setIsSaving(false);

            return;
        }

        const payload = {
            month: monthStr,
            pool: invoicePool,
            amount: amount,
        };
        console.log('Sending payload:', payload);

        try {
            const response = await fetch('/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Response data:', data);
                
                const newInvoice: Invoice = {
                    id: data.id,
                    month: data.month,
                    pool: data.pool,
                    amount: parseFloat(data.amount),
                };
                
                setInvoiceList([newInvoice, ...invoiceList]);
                setInvoiceMonth(null);
                setInvoicePool('big');
                setInvoiceAmount('');
                setShowHistoryModal(false);
                console.log('Invoice saved successfully');
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unable to parse error' }));
                console.error('Error saving invoice - Status:', response.status, 'Error:', errorData);
            }
        } catch (error) {
            console.error('Exception in handleSaveInvoice:', error);
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
                const updated = await response.json();
                // Update with proper typing
                const updatedInvoice: Invoice = {
                    id: updated.id,
                    month: updated.month,
                    pool: updated.pool,
                    amount: parseFloat(updated.amount),
                };
                setInvoiceList(
                    invoiceList.map((inv) =>
                        inv.id === updatedInvoice.id ? updatedInvoice : inv,
                    ),
                );
                setEditingInvoice(null);
                setEditAmount('');
                setEditPoolSelection('big');
            } else {
                const errorData = await response.json();
                console.error('Error updating invoice:', errorData);
            }
        } catch (error) {
            console.error('Error updating invoice:', error);
        }
    };

    const handleDeleteInvoice = async (id: number) => {
        try {
            const response = await fetch(`/invoices/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            if (response.ok) {
                setInvoiceList(invoiceList.filter((inv) => inv.id !== id));
                setEditingInvoice(null);
                setEditAmount('');
                // Close history modal to show updated list
                setShowHistoryModal(false);
            } else {
                console.error('Error deleting invoice');
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
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

                            <div className="flex gap-3">
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="medium"
                                    onClick={handleSaveInvoice}
                                    disabled={!invoiceAmount || !invoiceMonth || isSaving}
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

                        {/* Last Invoice / History Section */}
                        <div className="flex flex-col gap-4">
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                Invoice History
                            </Typography>

                            {lastInvoice ? (
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
                                                    lastInvoice.month,
                                                ).format('MMMM YYYY')}
                                            </Typography>
                                            {sortedMonths.length > 1 && (
                                                <Typography
                                                    variant="caption"
                                                    color="primary"
                                                >
                                                    {sortedMonths.length}{' '}
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
                                                label={`Big: ${formatCurrency(lastInvoice.big_pool)} MKD`}
                                                size="small"
                                                sx={{
                                                    ...chipSx,
                                                    bgcolor:
                                                        'rgba(33, 150, 243, 0.3)',
                                                }}
                                            />
                                            <Chip
                                                label={`Small: ${formatCurrency(lastInvoice.small_pool)} MKD`}
                                                size="small"
                                                sx={{
                                                    ...chipSx,
                                                    bgcolor:
                                                        'rgba(76, 175, 80, 0.3)',
                                                }}
                                            />
                                            <Chip
                                                label={`Total: ${formatCurrency(lastInvoice.total)} MKD`}
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
                                    No invoices recorded yet.
                                </Typography>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Invoice History Modal */}
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
                            Invoice History
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
                        {sortedMonths.map((month) => {
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
                                <Typography variant="body2" color="text.secondary">
                                    {dayjs(editingInvoice.month).format(
                                        'MMMM YYYY',
                                    )}
                                </Typography>
                                <FormControl variant="standard" sx={{ minWidth: 120 }}>
                                    <InputLabel
                                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                                    >
                                        Select Pool
                                    </InputLabel>
                                    <Select
                                        value={editPoolSelection}
                                        onChange={(e) => {
                                            const newPool = e.target.value as 'big' | 'small';
                                            setEditPoolSelection(newPool);
                                            const invoice = invoiceList.find(
                                                (i) =>
                                                    i.month === editingInvoice.month &&
                                                    i.pool === newPool,
                                            );

                                            if (invoice) {
                                                setEditingInvoice(invoice);
                                                setEditAmount(String(invoice.amount));
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
                                        <MenuItem value="big">Big Pool</MenuItem>
                                        <MenuItem value="small">Small Pool</MenuItem>
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
