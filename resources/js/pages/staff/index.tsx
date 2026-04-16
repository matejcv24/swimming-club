import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';

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

export default function StaffIndex({ staff }: Props) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', email: '' });

    // Salary states
    const [selectedCoach, setSelectedCoach] = useState<Staff | null>(null);
    const [salaries, setSalaries] = useState<Salary[]>([]);
    const [loadingSalaries, setLoadingSalaries] = useState(false);
    const [salaryAmount, setSalaryAmount] = useState('');
    const [salaryMonth, setSalaryMonth] = useState<Dayjs | null>(null);
    const [showSalaryHistoryModal, setShowSalaryHistoryModal] = useState(false);

    const filteredStaff = staff.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()),
    );

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
        if (!selectedCoach || !salaryAmount || !salaryMonth) return;

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

            {/* Main Staff Modal */}
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
                {/* Header */}
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

                {/* Staff List */}
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

            {/* Coach Salary Modal */}
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
                            {/* Record Salary */}
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

                            {/* Last Salary */}
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                Last Salary
                            </Typography>

                            {loadingSalaries ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Loading...
                                </Typography>
                            ) : salaries.length === 0 ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No salaries recorded yet.
                                </Typography>
                            ) : (
                                <List disablePadding>
                                    <ListItem
                                        divider
                                        sx={{
                                            px: 0,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                        onClick={() =>
                                            setShowSalaryHistoryModal(true)
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2">
                                                    {dayjs(
                                                        salaries[0].month,
                                                    ).format('MMMM YYYY')}
                                                </Typography>
                                            }
                                            secondary={
                                                salaries.length > 1 ? (
                                                    <Typography
                                                        variant="caption"
                                                        color="primary"
                                                    >
                                                        Click to see all{' '}
                                                        {salaries.length}{' '}
                                                        payments
                                                    </Typography>
                                                ) : null
                                            }
                                            sx={{
                                                flex: '1 1 auto',
                                                minWidth: 0,
                                            }}
                                        />
                                        <Chip
                                            label={`${salaries[0].amount} MKD`}
                                            color="success"
                                            size="small"
                                            sx={{ flexShrink: 0 }}
                                        />
                                    </ListItem>
                                </List>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Salary History Modal */}
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
                            Salary History — {selectedCoach?.name}
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
                        {salaries.map((salary) => (
                            <ListItem
                                key={salary.id}
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
                                            {dayjs(salary.month).format(
                                                'MMMM YYYY',
                                            )}
                                        </Typography>
                                    }
                                    sx={{ flex: '1 1 auto', minWidth: 0 }}
                                />
                                <Chip
                                    label={`${salary.amount} MKD`}
                                    color="success"
                                    size="small"
                                    sx={{ flexShrink: 0 }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>

            {/* Add Coach Modal */}
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
