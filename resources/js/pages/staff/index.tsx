import { Head, router } from '@inertiajs/react';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SearchIcon from '@mui/icons-material/Search';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';

interface Staff {
    id: number;
    name: string;
    email: string;
    password: string | null;
}

interface Salary {
    id: number;
    amount: number;
    month: string;
}

interface GroupedSalaryByMonth {
    month: string;
    total: number;
}

interface Props {
    staff: Staff[];
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

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function StaffIndex({ staff }: Props) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', email: '' });

    const [selectedCoach, setSelectedCoach] = useState<Staff | null>(null);
    const [salaries, setSalaries] = useState<Salary[]>([]);
    const [loadingSalaries, setLoadingSalaries] = useState(false);
    const [salaryAmount, setSalaryAmount] = useState('');
    const [salaryMonth, setSalaryMonth] = useState<Dayjs | null>(null);
    const [showSalaryHistoryModal, setShowSalaryHistoryModal] = useState(false);
    const [showSalaryYearDetailModal, setShowSalaryYearDetailModal] =
        useState(false);
    const [selectedSalaryYear, setSelectedSalaryYear] = useState<string | null>(
        null,
    );

    const filteredStaff = staff.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()),
    );

    const groupedSalaries: Record<string, GroupedSalaryByMonth> = {};

    salaries.forEach((salary) => {
        const monthKey = dayjs(salary.month)
            .startOf('month')
            .format('YYYY-MM-DD');

        if (!groupedSalaries[monthKey]) {
            groupedSalaries[monthKey] = {
                month: monthKey,
                total: 0,
            };
        }

        groupedSalaries[monthKey].total += Number(salary.amount);
    });

    const sortedSalaryMonths = Object.keys(groupedSalaries).sort().reverse();
    const currentYear = dayjs().format('YYYY');

    const currentYearSalaryMonths = sortedSalaryMonths.filter(
        (month) => dayjs(month).format('YYYY') === currentYear,
    );

    const currentYearLastSalaryMonth = currentYearSalaryMonths[0];
    const currentYearLastSalary = currentYearLastSalaryMonth
        ? groupedSalaries[currentYearLastSalaryMonth]
        : null;

    const salaryYearGroups: Record<
        string,
        { year: string; total: number; monthCount: number }
    > = {};

    Object.values(groupedSalaries).forEach((monthData) => {
        const year = dayjs(monthData.month).format('YYYY');

        if (!salaryYearGroups[year]) {
            salaryYearGroups[year] = {
                year,
                total: 0,
                monthCount: 0,
            };
        }

        salaryYearGroups[year].total += monthData.total;
        salaryYearGroups[year].monthCount += 1;
    });

    const sortedSalaryYears = Object.keys(salaryYearGroups)
        .filter((year) => year !== currentYear)
        .sort()
        .reverse();

    const salaryYearMonths = selectedSalaryYear
        ? sortedSalaryMonths.filter(
              (month) => dayjs(month).format('YYYY') === selectedSalaryYear,
          )
        : [];

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/staff', form, {
            onSuccess: () => {
                setShowAddModal(false);
                setForm({ name: '', email: '' });
            },
        });
    };

    const handleCoachClick = async (coach: Staff) => {
        setSelectedCoach(coach);
        setSalaries([]);
        setLoadingSalaries(true);
        setShowSalaryHistoryModal(false);
        setShowSalaryYearDetailModal(false);
        setSelectedSalaryYear(null);

        try {
            const response = await fetch(`/salaries/by-coach/${coach.id}`);
            const data = await response.json();
            setSalaries(data.salaries ?? []);
        } catch {
            setSalaries([]);
        }

        setLoadingSalaries(false);
    };

    const handleSalarySave = () => {
        if (!selectedCoach || !salaryAmount || !salaryMonth) {
            return;
        }

        router.post(
            '/salaries',
            {
                user_id: selectedCoach.id,
                amount: salaryAmount,
                month: salaryMonth.startOf('month').format('YYYY-MM-DD'),
            },
            {
                onSuccess: () => {
                    handleCoachClick(selectedCoach);
                    setSalaryAmount('');
                    setSalaryMonth(null);
                },
            },
        );
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <Head title="Staff" />

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
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <TextField
                            variant="standard"
                            placeholder="Search staff..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: 180 }}
                        />
                        <Typography variant="h6" fontWeight="bold">
                            Staff
                        </Typography>
                        <div className="flex items-center">
                            <IconButton
                                onClick={() => setShowAddModal(true)}
                                color="primary"
                            >
                                <PersonAddAlt1Icon />
                            </IconButton>
                            <IconButton
                                onClick={() => router.visit('/dashboard')}
                                color="error"
                            >
                                <CloseIcon />
                            </IconButton>
                        </div>
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    {filteredStaff.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 6 }}
                        >
                            No staff found.
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {filteredStaff.map((member) => (
                                <ListItemButton
                                    key={member.id}
                                    divider
                                    onClick={() => handleCoachClick(member)}
                                >
                                    <ListItemAvatar>
                                        <Avatar>
                                            {getInitials(member.name)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="body1"
                                                fontWeight="bold"
                                            >
                                                {member.name}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {member.password === null
                                                    ? '⏳ Invite pending'
                                                    : '✅ Active'}
                                            </Typography>
                                        }
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>

            {selectedCoach && (
                <Dialog
                    open={!!selectedCoach}
                    onClose={() => setSelectedCoach(null)}
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{
                        sx: { bgcolor: DARK_BG },
                    }}
                >
                    <DialogTitle sx={{ p: 0 }}>
                        <div className="flex items-center justify-between px-4 py-3">
                            <Typography variant="h6" fontWeight="bold">
                                {selectedCoach.name}
                            </Typography>
                            <IconButton
                                onClick={() => setSelectedCoach(null)}
                                color="error"
                            >
                                <CloseIcon />
                            </IconButton>
                        </div>
                        <Divider />
                    </DialogTitle>

                    <DialogContent sx={{ overflowY: 'auto' }}>
                        <div className="flex flex-col gap-6 py-4">
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                Record Salary
                            </Typography>

                            <Input
                                placeholder="Amount (MKD)"
                                type="number"
                                value={salaryAmount}
                                onChange={(e) =>
                                    setSalaryAmount(e.target.value)
                                }
                                fullWidth
                                inputProps={{ 'aria-label': 'salary amount' }}
                                sx={inputSx}
                            />

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Month"
                                    value={salaryMonth}
                                    onChange={(val) => setSalaryMonth(val)}
                                    views={['month', 'year']}
                                    sx={datePickerSx}
                                />
                            </LocalizationProvider>

                            <div className="flex gap-3">
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="medium"
                                    onClick={handleSalarySave}
                                    disabled={!salaryAmount || !salaryMonth}
                                >
                                    Save
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    onClick={() => {
                                        setSalaryAmount('');
                                        setSalaryMonth(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>

                            <Divider />

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                Payment History By Month
                            </Typography>

                            {loadingSalaries ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Loading...
                                </Typography>
                            ) : currentYearLastSalary ? (
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
                                            setShowSalaryHistoryModal(true)
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
                                                    currentYearLastSalary.month,
                                                ).format('MMMM YYYY')}
                                            </Typography>
                                            {currentYearSalaryMonths.length >
                                                1 && (
                                                <Typography
                                                    variant="caption"
                                                    color="primary"
                                                >
                                                    {
                                                        currentYearSalaryMonths.length
                                                    }{' '}
                                                    months
                                                </Typography>
                                            )}
                                        </div>

                                        <Chip
                                            label={`${formatCurrency(currentYearLastSalary.total)} MKD`}
                                            color="success"
                                            size="small"
                                        />
                                    </ListItem>
                                </List>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No salary payments recorded for{' '}
                                    {currentYear}.
                                </Typography>
                            )}

                            <Divider />

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                Payment History By Year
                            </Typography>

                            {loadingSalaries ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Loading...
                                </Typography>
                            ) : sortedSalaryYears.length > 0 ? (
                                <List disablePadding>
                                    {sortedSalaryYears.map((year) => (
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
                                                setSelectedSalaryYear(year);
                                                setShowSalaryYearDetailModal(
                                                    true,
                                                );
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
                                                        salaryYearGroups[year]
                                                            .monthCount
                                                    }{' '}
                                                    months
                                                </Typography>
                                            </div>

                                            <Chip
                                                label={`${formatCurrency(
                                                    salaryYearGroups[year]
                                                        .total,
                                                )} MKD`}
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
                                    No past-year payment history yet.
                                </Typography>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <Dialog
                open={showSalaryHistoryModal}
                onClose={() => setShowSalaryHistoryModal(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Payment History By Month — {selectedCoach?.name}
                        </Typography>
                        <IconButton
                            onClick={() => setShowSalaryHistoryModal(false)}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    <List disablePadding>
                        {currentYearSalaryMonths.map((month) => {
                            const monthData = groupedSalaries[month];

                            return (
                                <ListItem
                                    key={month}
                                    divider
                                    sx={{
                                        px: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
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
                                        sx={{ flex: '1 1 auto', minWidth: 0 }}
                                    />
                                    <Chip
                                        label={`${formatCurrency(monthData.total)} MKD`}
                                        color="success"
                                        size="small"
                                        sx={{ flexShrink: 0 }}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showSalaryYearDetailModal}
                onClose={() => {
                    setShowSalaryYearDetailModal(false);
                    setSelectedSalaryYear(null);
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
                            Payment History - {selectedSalaryYear} —{' '}
                            {selectedCoach?.name}
                        </Typography>
                        <IconButton
                            onClick={() => {
                                setShowSalaryYearDetailModal(false);
                                setSelectedSalaryYear(null);
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
                        {salaryYearMonths.map((month) => {
                            const monthData = groupedSalaries[month];

                            return (
                                <ListItem
                                    key={month}
                                    divider
                                    sx={{
                                        px: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
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
                                        sx={{ flex: '1 1 auto', minWidth: 0 }}
                                    />
                                    <Chip
                                        label={`${formatCurrency(monthData.total)} MKD`}
                                        color="success"
                                        size="small"
                                        sx={{ flexShrink: 0 }}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="relative flex items-center justify-between px-4 py-3">
                        <div className="w-10" />
                        <Typography variant="h6" fontWeight="bold">
                            Add Coach
                        </Typography>
                        <IconButton
                            onClick={() => setShowAddModal(false)}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent>
                    <form
                        onSubmit={handleAddSubmit}
                        className="flex flex-col gap-6 py-4"
                    >
                        <Input
                            placeholder="Full name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            required
                            fullWidth
                            inputProps={{ 'aria-label': 'coach name' }}
                            sx={inputSx}
                        />
                        <Input
                            type="email"
                            placeholder="Email address"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            required
                            fullWidth
                            inputProps={{ 'aria-label': 'coach email' }}
                            sx={inputSx}
                        />
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="medium"
                            >
                                Send Invite
                            </Button>
                            <Button
                                type="button"
                                variant="outlined"
                                fullWidth
                                size="medium"
                                onClick={() => setShowAddModal(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
}
