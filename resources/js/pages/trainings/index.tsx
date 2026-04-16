import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Dayjs } from 'dayjs';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

interface Member {
    id: number;
    name: string;
    pool: string;
}

interface Props {
    members: Member[];
}

const darkTheme = createTheme({
    palette: { mode: 'dark' },
});

const DARK_BG = '#1d232a';

export default function TrainingsIndex({ members }: Props) {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [checkedIds, setCheckedIds] = useState<number[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [attendanceSearch, setAttendanceSearch] = useState('');

    const activePool = activeTab === 0 ? 'big' : 'small';
    const poolMembers = members.filter((m) => m.pool === activePool);

    const handleDateClick = async (date: Dayjs | null) => {
        if (!date) return;
        setSelectedDate(date);
        setEditMode(false);
        setLoading(true);

        // Fetch existing attendance for this date and pool
        try {
            const response = await fetch(
                `/trainings/by-date?date=${date.format('YYYY-MM-DD')}&pool=${activePool}`,
            );
            const data = await response.json();
            setCheckedIds(data.member_ids ?? []);
        } catch {
            setCheckedIds([]);
        }

        setLoading(false);
        setShowAttendanceModal(true);
    };

    const toggleMember = (id: number) => {
        if (!editMode) return;
        setCheckedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const handleSave = () => {
        if (!selectedDate) return;

        router.post(
            '/trainings',
            {
                date: selectedDate.format('YYYY-MM-DD'),
                pool: activePool,
                member_ids: checkedIds,
            },
            {
                onSuccess: () => {
                    setShowAttendanceModal(false);
                    setCheckedIds([]);
                    setEditMode(false);
                },
            },
        );
    };

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    const isNewSession = checkedIds.length === 0 && !editMode;

    return (
        <ThemeProvider theme={darkTheme}>
            <Head title="Attendance" />

            {/* Main Attendance Modal */}
            <Dialog
                open={true}
                onClose={() => router.visit('/dashboard')}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: DARK_BG,
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                {/* Header */}
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <div className="relative flex items-center">
                            <Tabs
                                value={activeTab}
                                onChange={(_, val) => setActiveTab(val)}
                                centered
                                sx={{ flex: 1 }}
                            >
                                <Tab label="Big Pool" />
                                <Tab label="Small Pool" />
                            </Tabs>
                            <IconButton
                                onClick={() => router.visit('/dashboard')}
                                color="error"
                                sx={{ position: 'absolute', right: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </div>
                    </Box>
                </DialogTitle>

                {/* Date Calendar */}
                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateCalendar
                            onChange={(date: Dayjs | null) =>
                                handleDateClick(date)
                            }
                            sx={{ width: '100%' }}
                        />
                    </LocalizationProvider>
                </DialogContent>
            </Dialog>

            {/* Attendance List Modal */}
            <Dialog
                open={showAttendanceModal}
                onClose={() => setShowAttendanceModal(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex flex-col gap-3 px-4 py-3">
                        {/* Search Bar */}
                        <TextField
                            variant="standard"
                            placeholder="Search swimmer..."
                            value={attendanceSearch}
                            onChange={(e) => setAttendanceSearch(e.target.value)}
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& input': { color: 'white' },
                                '& .MuiInput-underline::before': { borderBottomColor: 'rgba(255,255,255,0.3)' },
                                '& .MuiInput-underline:hover::before': { borderBottomColor: 'white' },
                                '& .MuiInput-underline::after': { borderBottomColor: 'white' },
                            }}
                        />

                        {/* Date and Pool Info */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <Typography variant="h6" fontWeight="bold">
                                    {selectedDate?.format('DD MMM YYYY')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {activePool === 'big'
                                        ? 'Big Pool'
                                        : 'Small Pool'}
                                </Typography>
                            </div>
                            <div className="flex items-center gap-1">
                                <IconButton
                                    onClick={() => setEditMode((prev) => !prev)}
                                    color={editMode ? 'primary' : 'default'}
                                    title="Edit attendance"
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    onClick={() => {
                                        setShowAttendanceModal(false);
                                        setAttendanceSearch('');
                                    }}
                                    color="error"
                                >
                                    <CloseIcon />
                                </IconButton>
                            </div>
                        </div>
                    </div>
                    {editMode && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ px: 4, pb: 1, display: 'block' }}
                        >
                            Edit mode — check or uncheck members then save
                        </Typography>
                    )}
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {loading ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 4 }}
                        >
                            Loading...
                        </Typography>
                    ) : poolMembers.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 4 }}
                        >
                            No members registered for this pool.
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {poolMembers
                                .filter((m) =>
                                    (editMode ? true : checkedIds.includes(m.id)) &&
                                    m.name.toLowerCase().includes(attendanceSearch.toLowerCase())
                                )
                                .map((member) => (
                                    <ListItem
                                        key={member.id}
                                        divider
                                        secondaryAction={
                                            <Checkbox
                                                edge="end"
                                                checked={checkedIds.includes(
                                                    member.id,
                                                )}
                                                onChange={() =>
                                                    toggleMember(member.id)
                                                }
                                                disabled={!editMode}
                                            />
                                        }
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
                                        />
                                    </ListItem>
                                ))}
                        </List>
                    )}
                </DialogContent>

                {/* Footer */}
                <div className="p-4">
                    {editMode || isNewSession ? (
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={handleSave}
                            disabled={checkedIds.length === 0}
                        >
                            Save Attendance ({checkedIds.length} present)
                        </Button>
                    ) : (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center' }}
                        >
                            {checkedIds.length} member
                            {checkedIds.length !== 1 ? 's' : ''} attended —
                            click ✏️ to edit
                        </Typography>
                    )}
                </div>
            </Dialog>
        </ThemeProvider>
    );
}
