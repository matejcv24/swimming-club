import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Avatar from '@mui/material/Avatar';
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
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
    const [invoiceList, setInvoiceList] = useState<Invoice[]>(invoices);
    const [invoiceMonth, setInvoiceMonth] = useState<Dayjs | null>(null);
    const [invoicePool, setInvoicePool] = useState<'big' | 'small'>('big');
    const [invoiceAmount, setInvoiceAmount] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [editAmount, setEditAmount] = useState('');

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
        if (inv.pool === 'big') {
            groupedInvoices[inv.month].big_pool = inv.amount;
        } else {
            groupedInvoices[inv.month].small_pool = inv.amount;
        }
        groupedInvoices[inv.month].total =
            groupedInvoices[inv.month].big_pool +
            groupedInvoices[inv.month].small_pool;
    });

    const sortedMonths = Object.keys(groupedInvoices)
        .sort()
        .reverse();
    const lastMonth = sortedMonths[0];
    const lastInvoice = lastMonth ? groupedInvoices[lastMonth] : null;

    const handleSaveInvoice = () => {
        if (!invoiceMonth || !invoiceAmount) return;

        const monthStr = invoiceMonth.format('YYYY-MM-DD');

        router.post(
            '/invoices',
            {
                month: monthStr,
                pool: invoicePool,
                amount: invoiceAmount,
            },
            {
                onSuccess: () => {
                    setInvoiceMonth(null);
                    setInvoicePool('big');
                    setInvoiceAmount('');
                    // Reload invoices
                    router.get('/invoices');
                },
            },
        );
    };

    const handleUpdateInvoice = () => {
        if (!editingInvoice || !editAmount) return;

        router.put(
            `/invoices/${editingInvoice.id}`,
            { amount: editAmount },
            {
                onSuccess: () => {
                    setEditingInvoice(null);
                    setEditAmount('');
                    router.get('/invoices');
                },
            },
        );
    };

    const handleDeleteInvoice = (id: number) => {
        router.delete(`/invoices/${id}`, {
            onSuccess: () => {
                router.get('/invoices');
            },
        });
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
                                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>
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
                                    <MenuItem value="small">Small Pool</MenuItem>
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
                                    disabled={
                                        !invoiceAmount || !invoiceMonth
                                    }
                                >
                                    Save Invoice
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
                                            justifyContent:
                                                'space-between',
                                            alignItems: 'center',
                                            gap: 1,
                                            '&:hover': {
                                                bgcolor:
                                                    'rgba(255,255,255,0.05)',
                                            },
                                        }}
                                        onClick={() =>
                                            setShowHistoryModal(true)
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2">
                                                    {dayjs(
                                                        lastInvoice.month,
                                                    ).format('MMMM YYYY')}
                                                </Typography>
                                            }
                                            secondary={
                                                sortedMonths.length > 1 ? (
                                                    <Typography
                                                        variant="caption"
                                                        color="primary"
                                                    >
                                                        Click to see all{' '}
                                                        {sortedMonths.length}{' '}
                                                        months
                                                    </Typography>
                                                ) : null
                                            }
                                            sx={{
                                                flex: '1 1 auto',
                                                minWidth: 0,
                                            }}
                                        />
                                        <div className="flex gap-2 items-center">
                                            <div className="flex flex-col items-end text-right">
                                                <Chip
                                                    label={`Big: ${lastInvoice.big_pool} MKD`}
                                                    size="small"
                                                    sx={{
                                                        mb: 0.5,
                                                        bgcolor:
                                                            'rgba(33, 150, 243, 0.3)',
                                                    }}
                                                />
                                                <Chip
                                                    label={`Small: ${lastInvoice.small_pool} MKD`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor:
                                                            'rgba(76, 175, 80, 0.3)',
                                                    }}
                                                />
                                            </div>
                                            <Chip
                                                label={`Total: ${lastInvoice.total} MKD`}
                                                color="success"
                                                size="small"
                                                sx={{ flexShrink: 0 }}
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
                                        justifyContent:
                                            'space-between',
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
                                        sx={{
                                            flex: '1 1 auto',
                                            minWidth: 0,
                                        }}
                                    />
                                    <div className="flex gap-2 items-center flex-shrink-0">
                                        <div className="flex flex-col items-end text-right">
                                            <Chip
                                                label={`Big: ${monthData.big_pool} MKD`}
                                                size="small"
                                                sx={{
                                                    mb: 0.5,
                                                    bgcolor:
                                                        'rgba(33, 150, 243, 0.3)',
                                                }}
                                            />
                                            <Chip
                                                label={`Small: ${monthData.small_pool} MKD`}
                                                size="small"
                                                sx={{
                                                    bgcolor:
                                                        'rgba(76, 175, 80, 0.3)',
                                                }}
                                            />
                                        </div>
                                        <Chip
                                            label={`Total: ${monthData.total} MKD`}
                                            color="success"
                                            size="small"
                                        />
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                const bigInvoice =
                                                    invoiceList.find(
                                                        (i) =>
                                                            i.month ===
                                                                month &&
                                                            i.pool === 'big',
                                                    );
                                                const smallInvoice =
                                                    invoiceList.find(
                                                        (i) =>
                                                            i.month ===
                                                                month &&
                                                            i.pool === 'small',
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
                                                } else if (smallInvoice) {
                                                    setEditingInvoice(
                                                        smallInvoice,
                                                    );
                                                    setEditAmount(
                                                        String(
                                                            smallInvoice.amount,
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
                            <Typography variant="body2" color="text.secondary">
                                {dayjs(editingInvoice.month).format(
                                    'MMMM YYYY',
                                )}{' '}
                                - {editingInvoice.pool === 'big' ? 'Big' : 'Small'}{' '}
                                Pool
                            </Typography>

                            <Input
                                placeholder="Amount (MKD)"
                                type="number"
                                value={editAmount}
                                onChange={(e) =>
                                    setEditAmount(e.target.value)
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
