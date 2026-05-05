import { Head, router } from '@inertiajs/react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SearchIcon from '@mui/icons-material/Search';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';

interface Member {
    id: number;
    name: string;
    pool: string;
    status: 'active' | 'inactive';
    parent: {
        id: number;
        name: string;
        email: string | null;
        phone: string;
    };
}

interface Props {
    members: Member[];
}

interface ListMembersResponse {
    members: Member[];
}

interface StoreMemberResponse {
    message: string;
    member: Member;
}

interface UpdateMemberResponse {
    message: string;
    member: Member;
}

interface ValidationErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
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

const getCsrfToken = () =>
    document
        .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
        ?.getAttribute('content') ?? '';

export default function MembersIndex({ members: initialMembers }: Props) {
    const [members, setMembers] = useState(initialMembers);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [editMember, setEditMember] = useState<Member | null>(null);
    const [search, setSearch] = useState('');
    const [addError, setAddError] = useState<string | null>(null);
    const [addErrors, setAddErrors] = useState<Record<string, string[]>>({});
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});
    const [isUpdatingMember, setIsUpdatingMember] = useState(false);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        pool: 'big',
        status: 'active' as 'active' | 'inactive',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
    });

    const [editForm, setEditForm] = useState({
        name: '',
        pool: 'big',
        status: 'active' as 'active' | 'inactive',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
    });

    useEffect(() => {
        setMembers(initialMembers);
    }, [initialMembers]);

    useEffect(() => {
        const loadMembers = async () => {
            setIsLoadingMembers(true);
            setMembersError(null);

            try {
                const response = await fetch('/api/members', {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    throw new Error('Unable to load members.');
                }

                const data = (await response.json()) as ListMembersResponse;

                setMembers(data.members);
            } catch {
                setMembersError('Unable to refresh members right now.');
            } finally {
                setIsLoadingMembers(false);
            }
        };

        void loadMembers();
    }, []);

    useEffect(() => {
        const memberId = new URLSearchParams(window.location.search).get(
            'member',
        );

        if (!memberId) {
            return;
        }

        const notificationMember = members.find(
            (member) => member.id === Number(memberId),
        );

        if (notificationMember) {
            queueMicrotask(() => setSelectedMember(notificationMember));
        }
    }, [members]);

    const filteredMembers = members.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()),
    );

    const hasEditChanges =
        !!editMember &&
        (editForm.name !== editMember.name ||
            editForm.pool !== editMember.pool ||
            editForm.status !== editMember.status ||
            editForm.parent_name !== (editMember.parent?.name ?? '') ||
            editForm.parent_email !== (editMember.parent?.email ?? '') ||
            editForm.parent_phone !== (editMember.parent?.phone ?? ''));

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError(null);
        setAddErrors({});
        setIsAddingMember(true);

        try {
            const response = await fetch('/api/members', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(form),
            });

            if (response.status === 422) {
                const data = (await response.json()) as ValidationErrorResponse;

                setAddErrors(data.errors ?? {});
                setAddError(data.message ?? 'Please check the form.');

                return;
            }

            if (!response.ok) {
                throw new Error('Unable to save member.');
            }

            const data = (await response.json()) as StoreMemberResponse;

            setMembers((currentMembers) => [...currentMembers, data.member]);
            setShowAddModal(false);
            setForm({
                name: '',
                pool: 'big',
                status: 'active',
                parent_name: '',
                parent_email: '',
                parent_phone: '',
            });
        } catch {
            setAddError(
                'Unable to save member. Please check the form and try again.',
            );
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleEditClick = (e: React.MouseEvent, member: Member) => {
        e.stopPropagation();
        setEditError(null);
        setEditErrors({});
        setEditMember(member);
        setEditForm({
            name: member.name,
            pool: member.pool,
            status: member.status ?? 'active',
            parent_name: member.parent?.name ?? '',
            parent_email: member.parent?.email ?? '',
            parent_phone: member.parent?.phone ?? '',
        });
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editMember) {
            return;
        }

        if (!hasEditChanges) {
            return;
        }

        setEditError(null);
        setEditErrors({});
        setIsUpdatingMember(true);

        try {
            const response = await fetch(`/api/members/${editMember.id}`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(editForm),
            });

            if (response.status === 422) {
                const data = (await response.json()) as ValidationErrorResponse;

                setEditErrors(data.errors ?? {});
                setEditError(data.message ?? 'Please check the form.');

                return;
            }

            if (!response.ok) {
                throw new Error('Unable to update member.');
            }

            const data = (await response.json()) as UpdateMemberResponse;

            setMembers((currentMembers) =>
                currentMembers.map((member) =>
                    member.id === data.member.id ? data.member : member,
                ),
            );
            setSelectedMember((currentMember) =>
                currentMember?.id === data.member.id
                    ? data.member
                    : currentMember,
            );
            setEditMember(null);
        } catch {
            setEditError(
                'Unable to update member. Please check the form and try again.',
            );
        } finally {
            setIsUpdatingMember(false);
        }
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <Head title="Members" />

            {/* Members List Modal */}
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
                            placeholder="Search members..."
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
                            Members
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

                {/* Members List */}
                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    {membersError && (
                        <Typography
                            variant="body2"
                            color="error"
                            sx={{ textAlign: 'center', mt: 2 }}
                        >
                            {membersError}
                        </Typography>
                    )}

                    {isLoadingMembers ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 6 }}
                        >
                            Loading members...
                        </Typography>
                    ) : filteredMembers.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 6 }}
                        >
                            No members found.
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {filteredMembers.map((member) => (
                                <ListItemButton
                                    key={member.id}
                                    divider
                                    onClick={() => setSelectedMember(member)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
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
                                                {member.pool === 'big'
                                                    ? 'Big Pool'
                                                    : 'Small Pool'}{' '}
                                                •{' '}
                                                <span
                                                    style={{
                                                        color:
                                                            member.status ===
                                                            'active'
                                                                ? '#4caf50' // green
                                                                : '#f44336', // red
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {member.status === 'active'
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </Typography>
                                        }
                                    />
                                    {/* Edit + Delete icons */}
                                    <div className="ml-auto flex items-center gap-1">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={(e) =>
                                                handleEditClick(e, member)
                                            }
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </div>
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>

            {/* Member Detail Modal */}
            <Dialog
                open={!!selectedMember}
                onClose={() => setSelectedMember(null)}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: DARK_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <IconButton onClick={() => setSelectedMember(null)}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6" fontWeight="bold">
                            Member Details
                        </Typography>
                        <IconButton
                            onClick={() => setSelectedMember(null)}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent>
                    {selectedMember && (
                        <div className="space-y-4 py-4">
                            <div>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Swimmer
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {selectedMember.name}
                                </Typography>
                            </div>
                            <div>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Status
                                </Typography>
                                <Typography
                                    variant="body1"
                                    color={
                                        selectedMember.status === 'active'
                                            ? 'success.main'
                                            : 'error.main'
                                    }
                                >
                                    {selectedMember.status === 'active'
                                        ? 'Active'
                                        : 'Inactive'}
                                </Typography>
                            </div>

                            <div>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Pool
                                </Typography>
                                <Typography variant="body1">
                                    {selectedMember.pool === 'big'
                                        ? 'Big Pool'
                                        : 'Small Pool'}
                                </Typography>
                            </div>
                            <Divider />
                            <div>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Parent
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {selectedMember.parent?.name ?? '—'}
                                </Typography>
                            </div>
                            <div>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Parent Email
                                </Typography>
                                <Typography variant="body1">
                                    {selectedMember.parent?.email ?? '—'}
                                </Typography>
                            </div>
                            <div>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Parent Phone
                                </Typography>
                                <Typography variant="body1">
                                    {selectedMember.parent?.phone ?? '—'}
                                </Typography>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Member Modal */}
            <Dialog
                open={!!editMember}
                onClose={() => setEditMember(null)}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: DARK_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* LEFT: Switch */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editForm.status === 'active'}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            status: e.target.checked
                                                ? 'active'
                                                : 'inactive',
                                        })
                                    }
                                />
                            }
                            label={
                                editForm.status === 'active'
                                    ? 'Active'
                                    : 'Inactive'
                            }
                            sx={{
                                m: 0,
                                '& .MuiTypography-root': { fontSize: '0.9rem' },
                            }}
                        />

                        {/* RIGHT: Close button */}
                        <IconButton
                            onClick={() => setEditMember(null)}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent>
                    <form
                        onSubmit={handleEditSubmit}
                        className="flex flex-col gap-6 py-4"
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}
                        >
                            Swimmer Info
                        </Typography>

                        {editError && (
                            <Typography color="error" variant="body2">
                                {editError}
                            </Typography>
                        )}

                        <Input
                            placeholder="Full name"
                            value={editForm.name}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    name: e.target.value,
                                })
                            }
                            required
                            fullWidth
                            inputProps={{ 'aria-label': 'member name' }}
                            sx={inputSx}
                        />
                        {editErrors.name?.[0] && (
                            <Typography color="error" variant="caption">
                                {editErrors.name[0]}
                            </Typography>
                        )}

                        <FormControl fullWidth>
                            <InputLabel
                                id="edit-pool-label"
                                sx={{ color: 'rgba(255,255,255,0.5)' }}
                            >
                                Pool
                            </InputLabel>
                            <Select
                                labelId="edit-pool-label"
                                value={editForm.pool}
                                label="Pool"
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        pool: e.target.value,
                                    })
                                }
                                sx={{
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.3)',
                                    },
                                    '& .MuiSvgIcon-root': { color: 'white' },
                                }}
                            >
                                <MenuItem value="big">Big Pool</MenuItem>
                                <MenuItem value="small">Small Pool</MenuItem>
                            </Select>
                        </FormControl>
                        {editErrors.pool?.[0] && (
                            <Typography color="error" variant="caption">
                                {editErrors.pool[0]}
                            </Typography>
                        )}
                        {editErrors.status?.[0] && (
                            <Typography color="error" variant="caption">
                                {editErrors.status[0]}
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
                            Parent Info
                        </Typography>

                        <Input
                            placeholder="Parent full name"
                            value={editForm.parent_name}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    parent_name: e.target.value,
                                })
                            }
                            required
                            fullWidth
                            inputProps={{ 'aria-label': 'parent name' }}
                            sx={inputSx}
                        />
                        {editErrors.parent_name?.[0] && (
                            <Typography color="error" variant="caption">
                                {editErrors.parent_name[0]}
                            </Typography>
                        )}

                        <Input
                            type="email"
                            placeholder="Parent email (optional)"
                            value={editForm.parent_email}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    parent_email: e.target.value,
                                })
                            }
                            fullWidth
                            inputProps={{ 'aria-label': 'parent email' }}
                            sx={inputSx}
                        />
                        {editErrors.parent_email?.[0] && (
                            <Typography color="error" variant="caption">
                                {editErrors.parent_email[0]}
                            </Typography>
                        )}

                        <Input
                            placeholder="Parent phone"
                            value={editForm.parent_phone}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    parent_phone: e.target.value,
                                })
                            }
                            required
                            fullWidth
                            inputProps={{ 'aria-label': 'parent phone' }}
                            sx={inputSx}
                        />
                        {editErrors.parent_phone?.[0] && (
                            <Typography color="error" variant="caption">
                                {editErrors.parent_phone[0]}
                            </Typography>
                        )}

                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="medium"
                                disabled={!hasEditChanges || isUpdatingMember}
                            >
                                {isUpdatingMember
                                    ? 'Saving...'
                                    : 'Save Changes'}
                            </Button>
                            <Button
                                type="button"
                                variant="outlined"
                                fullWidth
                                size="medium"
                                onClick={() => setEditMember(null)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Member Modal */}
            {showAddModal && (
                <Dialog
                    open={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    disableRestoreFocus
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{ sx: { bgcolor: DARK_BG } }}
                >
                    <DialogTitle sx={{ p: 0 }}>
                        <div className="flex items-center justify-between px-4 py-3">
                            {/* LEFT: Switch */}
                            <FormControlLabel
                                control={<Switch checked disabled />}
                                label="Active"
                                sx={{
                                    m: 0,
                                    '& .MuiTypography-root': {
                                        fontSize: '0.9rem',
                                    },
                                }}
                            />

                            {/* CENTER: Title */}
                            <Typography variant="h6" fontWeight="bold">
                                Add Member
                            </Typography>

                            {/* RIGHT: Close */}
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
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                Swimmer Info
                            </Typography>

                            <Input
                                placeholder="Enter swimmer's full name"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                required
                                fullWidth
                                inputProps={{ 'aria-label': 'swimmer name' }}
                                sx={inputSx}
                            />
                            {addErrors.name?.[0] && (
                                <Typography color="error" variant="caption">
                                    {addErrors.name[0]}
                                </Typography>
                            )}

                            <FormControl fullWidth>
                                <InputLabel
                                    id="pool-label"
                                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                                >
                                    Pool
                                </InputLabel>
                                <Select
                                    labelId="pool-label"
                                    value={form.pool}
                                    label="Pool"
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            pool: e.target.value,
                                        })
                                    }
                                    sx={{
                                        color: 'white',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor:
                                                'rgba(255,255,255,0.3)',
                                        },
                                        '& .MuiSvgIcon-root': {
                                            color: 'white',
                                        },
                                    }}
                                >
                                    <MenuItem value="big">Big Pool</MenuItem>
                                    <MenuItem value="small">
                                        Small Pool
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            {addErrors.pool?.[0] && (
                                <Typography color="error" variant="caption">
                                    {addErrors.pool[0]}
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
                                Parent Info
                            </Typography>

                            {addError && (
                                <Typography color="error" variant="body2">
                                    {addError}
                                </Typography>
                            )}

                            <Input
                                placeholder="Enter parent's full name"
                                value={form.parent_name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        parent_name: e.target.value,
                                    })
                                }
                                required
                                fullWidth
                                inputProps={{ 'aria-label': 'parent name' }}
                                sx={inputSx}
                            />
                            {addErrors.parent_name?.[0] && (
                                <Typography color="error" variant="caption">
                                    {addErrors.parent_name[0]}
                                </Typography>
                            )}
                            <Input
                                type="email"
                                placeholder="Enter parent's email (optional)"
                                value={form.parent_email}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        parent_email: e.target.value,
                                    })
                                }
                                fullWidth
                                inputProps={{ 'aria-label': 'parent email' }}
                                sx={inputSx}
                            />
                            {addErrors.parent_email?.[0] && (
                                <Typography color="error" variant="caption">
                                    {addErrors.parent_email[0]}
                                </Typography>
                            )}
                            <Input
                                placeholder="Enter parent's phone number"
                                value={form.parent_phone}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        parent_phone: e.target.value,
                                    })
                                }
                                required
                                fullWidth
                                inputProps={{ 'aria-label': 'parent phone' }}
                                sx={inputSx}
                            />
                            {addErrors.parent_phone?.[0] && (
                                <Typography color="error" variant="caption">
                                    {addErrors.parent_phone[0]}
                                </Typography>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    size="medium"
                                    disabled={isAddingMember}
                                >
                                    {isAddingMember
                                        ? 'Saving...'
                                        : 'Save Member'}
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
            )}
        </ThemeProvider>
    );
}
