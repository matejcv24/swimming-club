import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Member {
    id: number;
    name: string;
    pool: string;
    parent: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
}

interface Props {
    members: Member[];
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

export default function MembersIndex({ members }: Props) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [editMember, setEditMember] = useState<Member | null>(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({
        name: '',
        pool: 'big',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
    });
    const [editForm, setEditForm] = useState({
        name: '',
        pool: 'big',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
    });

    const filteredMembers = members.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()),
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
        router.post('/members', form, {
            onSuccess: () => {
                setShowAddModal(false);
                setForm({
                    name: '',
                    pool: 'big',
                    parent_name: '',
                    parent_email: '',
                    parent_phone: '',
                });
            },
        });
    };

    const handleEditClick = (e: React.MouseEvent, member: Member) => {
        e.stopPropagation();
        setEditMember(member);
        setEditForm({
            name: member.name,
            pool: member.pool,
            parent_name: member.parent?.name ?? '',
            parent_email: member.parent?.email ?? '',
            parent_phone: member.parent?.phone ?? '',
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editMember) return;
        router.patch(`/members/${editMember.id}`, editForm, {
            onSuccess: () => setEditMember(null),
        });
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

    const handleDeleteClick = (e: React.MouseEvent, member: Member) => {
        e.stopPropagation();
        setMemberToDelete(member);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = () => {
        if (!memberToDelete) return;
        router.delete(`/members/${memberToDelete.id}`, {
            onSuccess: () => {
                setShowDeleteModal(false);
                setMemberToDelete(null);
            },
        });
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
                    {filteredMembers.length === 0 ? (
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
                                                    : 'Small Pool'}
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
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={(e) =>
                                                handleDeleteClick(e, member)
                                            }
                                        >
                                            <DeleteIcon fontSize="small" />
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
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: DARK_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="w-10" />
                        <Typography variant="h6" fontWeight="bold">
                            Edit Member
                        </Typography>
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

                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="medium"
                            >
                                Save Changes
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
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{ sx: { bgcolor: DARK_BG } }}
                >
                    <DialogTitle sx={{ p: 0 }}>
                        <div className="relative flex items-center justify-between px-4 py-3">
                            <div className="w-10" />
                            <Typography variant="h6" fontWeight="bold">
                                Add Member
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

                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    size="medium"
                                >
                                    Save Member
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
            {/* Delete Confirmation Modal */}
            <Dialog
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { bgcolor: DARK_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Delete Member
                        </Typography>
                        <IconButton
                            onClick={() => setShowDeleteModal(false)}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent>
                    <div className="flex flex-col gap-6 py-4">
                        <Typography variant="body1">
                            Are you sure you want to delete{' '}
                            <strong>{memberToDelete?.name}</strong>?
                        </Typography>
                        <div className="flex gap-3">
                            <Button
                                variant="contained"
                                color="error"
                                fullWidth
                                onClick={handleDeleteConfirm}
                            >
                                Yes, Delete
                            </Button>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
}
