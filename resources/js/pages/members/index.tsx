import { Head, Link, router } from '@inertiajs/react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
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
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import { MemberDetailsDialog } from '@/components/member-details-dialog';
import {
    MuiThemeProvider,
    POPUP_BG,
    POPUP_FG,
    popupFg,
} from '@/components/mui-theme-provider';
import {
    avatarSx,
    CloseButton,
    PillSearchField,
    GroupChip,
    PopupHeader,
    StatusDot,
} from '@/components/popup-ui';
import { usePagePopup } from '@/hooks/use-page-popup';
import type { ClubGroup } from '@/lib/groups';
import { groupWithSubgroupName, subgroupsOf, useGroups } from '@/lib/groups';
import { t } from '@/lib/i18n';

interface Member {
    id: number;
    name: string;
    group_id: number | null;
    subgroup_id: number | null;
    status: 'active' | 'inactive';
    parent: {
        id: number;
        name: string;
        phone: string;
    };
}

interface Props {
    members: Member[];
    userRole: 'admin' | 'coach';
}

const inputSx = {
    color: POPUP_FG,
    '&::before': { borderBottomColor: POPUP_FG },
    '&::after': { borderBottomColor: POPUP_FG },
    '& input::placeholder': { color: popupFg(0.5) },
};

export default function MembersIndex({ members, userRole }: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    const groups = useGroups();
    // New members go to the club's first group unless another is picked
    const firstGroupId: number | '' = groups[0]?.id ?? '';
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteMember, setDeleteMember] = useState<Member | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [editMember, setEditMember] = useState<Member | null>(null);
    const [search, setSearch] = useState('');
    const [memberStatusTab, setMemberStatusTab] = useState(0);
    const [form, setForm] = useState({
        name: '',
        group_id: firstGroupId as number | '',
        // '' = no subgroup
        subgroup_id: '' as number | '',
        status: 'active' as 'active' | 'inactive',
        parent_name: '',
        parent_phone: '',
    });

    const [editForm, setEditForm] = useState({
        name: '',
        group_id: firstGroupId as number | '',
        // '' = no subgroup
        subgroup_id: '' as number | '',
        status: 'active' as 'active' | 'inactive',
        parent_name: '',
        parent_phone: '',
    });

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

    const activeMembers = members.filter(
        (member) => member.status === 'active',
    );
    const inactiveMembers = members.filter(
        (member) => member.status !== 'active',
    );
    const visibleMembers =
        memberStatusTab === 0 ? activeMembers : inactiveMembers;
    const filteredMembers = visibleMembers.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()),
    );

    const hasEditChanges =
        !!editMember &&
        (editForm.name !== editMember.name ||
            editForm.group_id !== (editMember.group_id ?? '') ||
            editForm.subgroup_id !== (editMember.subgroup_id ?? '') ||
            editForm.status !== editMember.status ||
            editForm.parent_name !== (editMember.parent?.name ?? '') ||
            editForm.parent_phone !== (editMember.parent?.phone ?? ''));

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
                    group_id: firstGroupId as number | '',
                    subgroup_id: '',
                    status: 'active',
                    parent_name: '',
                    parent_phone: '',
                });
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteMember) {
            return;
        }

        setDeleting(true);
        router.delete(`/members/${deleteMember.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedMember?.id === deleteMember.id) {
                    setSelectedMember(null);
                }

                setDeleteMember(null);
            },
            onFinish: () => setDeleting(false),
        });
    };

    const handleEditClick = (e: React.MouseEvent, member: Member) => {
        e.stopPropagation();
        setEditMember(member);
        setEditForm({
            name: member.name,
            group_id: member.group_id ?? '',
            subgroup_id: member.subgroup_id ?? '',
            status: member.status ?? 'active',
            parent_name: member.parent?.name ?? '',
            parent_phone: member.parent?.phone ?? '',
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editMember) {
            return;
        }

        if (!hasEditChanges) {
            return;
        }

        router.patch(`/members/${editMember.id}`, editForm, {
            onSuccess: () => setEditMember(null),
        });
    };

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title={t('Members')} />

            {/* Members List Modal */}
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
                {/* Header */}
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<GroupsIcon fontSize="small" />}
                        title={t('Members')}
                        subtitle={t(':active active · :inactive inactive', {
                            active: activeMembers.length,
                            inactive: inactiveMembers.length,
                        })}
                        actions={
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<PersonAddAlt1Icon />}
                                onClick={() => setShowAddModal(true)}
                            >
                                {t('Add')}
                            </Button>
                        }
                        onClose={popup.close}
                    />
                    <PillSearchField
                        value={search}
                        onChange={setSearch}
                        placeholder={t('Search members...')}
                    />
                    <Tabs
                        value={memberStatusTab}
                        onChange={(_, newValue) => setMemberStatusTab(newValue)}
                        variant="fullWidth"
                        textColor="inherit"
                        indicatorColor="primary"
                    >
                        <Tab
                            label={t('Active (:count)', {
                                count: activeMembers.length,
                            })}
                        />
                        <Tab
                            label={t('Inactive (:count)', {
                                count: inactiveMembers.length,
                            })}
                        />
                    </Tabs>
                </DialogTitle>

                {/* Members List */}
                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    {filteredMembers.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 6 }}
                        >
                            {t('No members found.')}
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {filteredMembers.map((member, index) => (
                                <ListItemButton
                                    key={member.id}
                                    divider
                                    onClick={() => setSelectedMember(member)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        px: 2.25,
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={avatarSx(index)}>
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
                                            <span className="mt-1 flex items-center gap-2">
                                                <GroupChip
                                                    name={groupWithSubgroupName(
                                                        groups,
                                                        member.group_id,
                                                        member.subgroup_id,
                                                    )}
                                                />
                                                <StatusDot
                                                    active={
                                                        member.status ===
                                                        'active'
                                                    }
                                                />
                                            </span>
                                        }
                                        secondaryTypographyProps={{
                                            component: 'span',
                                        }}
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
                                        {userRole === 'admin' && (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                aria-label={t('Delete member')}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteMember(member);
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </div>
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Member Confirmation Modal */}
            {userRole === 'admin' && (
                <Dialog
                    open={!!deleteMember}
                    onClose={() => setDeleteMember(null)}
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
                                {t('Delete Member')}
                            </Typography>
                            <CloseButton
                                onClick={() => setDeleteMember(null)}
                            />
                        </div>
                        <Divider />
                    </DialogTitle>

                    <DialogContent>
                        <div className="flex flex-col gap-4 py-4">
                            <Typography variant="body1">
                                {t('Are you sure you want to delete')}{' '}
                                <strong>{deleteMember?.name}</strong>?
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t(
                                    'All of their membership fees, attendance records and parent details will be deleted too. This cannot be undone.',
                                )}
                            </Typography>
                            <div className="flex gap-3">
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    onClick={() => setDeleteMember(null)}
                                    disabled={deleting}
                                >
                                    {t('No')}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    fullWidth
                                    size="medium"
                                    onClick={handleDeleteConfirm}
                                    disabled={deleting}
                                >
                                    {t('Yes')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Member Detail Modal */}
            <MemberDetailsDialog
                member={selectedMember}
                onClose={() => setSelectedMember(null)}
            />

            {/* Edit Member Modal */}
            <Dialog
                open={!!editMember}
                onClose={() => setEditMember(null)}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
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
                                    ? t('Active')
                                    : t('Inactive')
                            }
                            sx={{
                                m: 0,
                                '& .MuiTypography-root': { fontSize: '0.9rem' },
                            }}
                        />

                        {/* RIGHT: Close button */}
                        <CloseButton onClick={() => setEditMember(null)} />
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
                            {t('Member Info')}
                        </Typography>

                        <Input
                            placeholder={t('Full name')}
                            value={editForm.name}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    name: e.target.value,
                                })
                            }
                            required
                            fullWidth
                            inputProps={{ 'aria-label': t('Member name') }}
                            sx={inputSx}
                        />

                        <FormControl fullWidth>
                            <InputLabel
                                id="edit-pool-label"
                                sx={{ color: popupFg(0.5) }}
                            >
                                {t('Group')}
                            </InputLabel>
                            <Select
                                labelId="edit-pool-label"
                                value={editForm.group_id}
                                label={t('Group')}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        group_id: Number(e.target.value),
                                        // Subgroups belong to one group
                                        subgroup_id: '',
                                    })
                                }
                                sx={{
                                    color: POPUP_FG,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: popupFg(0.3),
                                    },
                                    '& .MuiSvgIcon-root': { color: POPUP_FG },
                                }}
                            >
                                {groups.map((group) => (
                                    <MenuItem key={group.id} value={group.id}>
                                        {group.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <SubgroupSelect
                            id="edit-subgroup-label"
                            groups={groups}
                            groupId={editForm.group_id}
                            value={editForm.subgroup_id}
                            onChange={(subgroupId) =>
                                setEditForm({
                                    ...editForm,
                                    subgroup_id: subgroupId,
                                })
                            }
                        />

                        <Divider />

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}
                        >
                            {t('Parent Info')}
                        </Typography>

                        <Input
                            placeholder={t('Parent full name')}
                            value={editForm.parent_name}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    parent_name: e.target.value,
                                })
                            }
                            required
                            fullWidth
                            inputProps={{ 'aria-label': t('Parent name') }}
                            sx={inputSx}
                        />

                        <Input
                            placeholder={t('Parent phone')}
                            value={editForm.parent_phone}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    parent_phone: e.target.value,
                                })
                            }
                            required
                            fullWidth
                            inputProps={{ 'aria-label': t('Parent phone') }}
                            sx={inputSx}
                        />

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outlined"
                                fullWidth
                                size="medium"
                                onClick={() => setEditMember(null)}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="medium"
                                disabled={!hasEditChanges}
                            >
                                {t('Save Changes')}
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
                    PaperProps={{ sx: { bgcolor: POPUP_BG } }}
                >
                    <DialogTitle sx={{ p: 0 }}>
                        <div className="flex items-center justify-between px-4 py-3">
                            {/* LEFT: Switch */}
                            <FormControlLabel
                                control={<Switch checked disabled />}
                                label={t('Active')}
                                sx={{
                                    m: 0,
                                    '& .MuiTypography-root': {
                                        fontSize: '0.9rem',
                                    },
                                }}
                            />

                            {/* CENTER: Title */}
                            <Typography variant="h6" fontWeight="bold">
                                {t('Add Member')}
                            </Typography>

                            {/* RIGHT: Close */}
                            <CloseButton
                                onClick={() => setShowAddModal(false)}
                            />
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
                                {t('Member Info')}
                            </Typography>

                            <Input
                                placeholder={t("Enter member's full name")}
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                required
                                fullWidth
                                inputProps={{ 'aria-label': t('Member name') }}
                                sx={inputSx}
                            />

                            {/* Members need a group: point to where groups are made */}
                            {groups.length === 0 && (
                                <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
                                    {t('No groups yet.')}{' '}
                                    {userRole === 'admin' ? (
                                        <Link
                                            href="/groups"
                                            className="font-semibold underline"
                                        >
                                            {t('Create them in Groups')}
                                        </Link>
                                    ) : (
                                        t('Ask an admin to add one.')
                                    )}
                                </p>
                            )}

                            <FormControl fullWidth>
                                <InputLabel
                                    id="pool-label"
                                    sx={{ color: popupFg(0.5) }}
                                >
                                    {t('Group')}
                                </InputLabel>
                                <Select
                                    labelId="pool-label"
                                    value={form.group_id}
                                    label={t('Group')}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            group_id: Number(e.target.value),
                                            // Subgroups belong to one group
                                            subgroup_id: '',
                                        })
                                    }
                                    sx={{
                                        color: POPUP_FG,
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: popupFg(0.3),
                                        },
                                        '& .MuiSvgIcon-root': {
                                            color: POPUP_FG,
                                        },
                                    }}
                                >
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

                            <SubgroupSelect
                                id="subgroup-label"
                                groups={groups}
                                groupId={form.group_id}
                                value={form.subgroup_id}
                                onChange={(subgroupId) =>
                                    setForm({
                                        ...form,
                                        subgroup_id: subgroupId,
                                    })
                                }
                            />

                            <Divider />

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                {t('Parent Info')}
                            </Typography>

                            <Input
                                placeholder={t("Enter parent's full name")}
                                value={form.parent_name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        parent_name: e.target.value,
                                    })
                                }
                                required
                                fullWidth
                                inputProps={{ 'aria-label': t('Parent name') }}
                                sx={inputSx}
                            />
                            <Input
                                placeholder={t("Enter parent's phone number")}
                                value={form.parent_phone}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        parent_phone: e.target.value,
                                    })
                                }
                                required
                                fullWidth
                                inputProps={{ 'aria-label': t('Parent phone') }}
                                sx={inputSx}
                            />

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    {t('Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    size="medium"
                                >
                                    {t('Save Member')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </MuiThemeProvider>
    );
}

/** Optional subgroup of the chosen group; hidden when the group has none. */
function SubgroupSelect({
    id,
    groups,
    groupId,
    value,
    onChange,
}: {
    id: string;
    groups: ClubGroup[];
    groupId: number | '';
    value: number | '';
    onChange: (subgroupId: number | '') => void;
}) {
    const subgroups = subgroupsOf(groups, groupId === '' ? null : groupId);

    if (subgroups.length === 0) {
        return null;
    }

    return (
        <FormControl fullWidth>
            <InputLabel id={id} shrink sx={{ color: popupFg(0.5) }}>
                {t('Subgroup (optional)')}
            </InputLabel>
            <Select
                labelId={id}
                value={value}
                label={t('Subgroup (optional)')}
                displayEmpty
                notched
                onChange={(e) =>
                    onChange(
                        String(e.target.value) === ''
                            ? ''
                            : Number(e.target.value),
                    )
                }
                sx={{
                    color: POPUP_FG,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: popupFg(0.3),
                    },
                    '& .MuiSvgIcon-root': { color: POPUP_FG },
                }}
            >
                <MenuItem value="">{t('No subgroup')}</MenuItem>
                {subgroups.map((subgroup) => (
                    <MenuItem key={subgroup.id} value={subgroup.id}>
                        {subgroup.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
