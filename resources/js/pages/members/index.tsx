import { Head, Link, router } from '@inertiajs/react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GroupsIcon from '@mui/icons-material/Groups';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import { MemberDetailsDialog } from '@/components/member-details-dialog';
import {
    MuiThemeProvider,
    POPUP_BG,
    POPUP_FG,
    popupFg,
} from '@/components/mui-theme-provider';
import {
    AddButton,
    avatarSx,
    FIELD_SX,
    ConfirmDialog,
    EmptyState,
    PillSearchField,
    GroupChip,
    PopupHeader,
} from '@/components/popup-ui';
import { usePagePopup } from '@/hooks/use-page-popup';
import type { ClubGroup } from '@/lib/groups';
import { groupWithSubgroupName, subgroupsOf, useGroups } from '@/lib/groups';
import { t } from '@/lib/i18n';
import { showToast } from '@/lib/toast';

interface Member {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    group_id: number | null;
    subgroup_id: number | null;
    status: 'active' | 'inactive';
    /** End of the latest membership fee (null: never paid). */
    membership_fees_max_end_date?: string | null;
    parent: {
        id: number;
        name: string;
        phone: string;
        email: string | null;
    };
}

/** This month's fee: paid (green) or not (red). */
function PaidPill({ paid }: { paid: boolean }) {
    return (
        <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${
                paid
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                    : 'bg-red-500/15 text-red-600 dark:text-red-400'
            }`}
        >
            {paid ? t('Paid') : t('Not paid')}
        </span>
    );
}

interface Props {
    members: Member[];
    userRole: 'admin' | 'coach';
}

/** A member that is almost certainly the one being saved (see DuplicateMembers). */
interface DuplicateMatch {
    id: number;
    name: string;
    group: string | null;
    status: 'active' | 'inactive';
    parent: string | null;
    canOpen: boolean;
    /** Deleted (hidden) earlier: can be brought back with their history. */
    deleted: boolean;
}

/** The duplicate warning: from adding or editing, and whether "add anyway" was pressed once. */
interface DuplicateWarning {
    kind: 'add' | 'edit';
    matches: DuplicateMatch[];
    confirming: boolean;
}

export default function MembersIndex({ members, userRole }: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    const groups = useGroups();
    // From the dashboard's "New member" quick action: just the Add Member form
    const [openedToAdd] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('add') === '1',
    );
    const [showAddModal, setShowAddModal] = useState(openedToAdd);
    const closeAdd = () => {
        setShowAddModal(false);

        // Only the form was open: straight back to the dashboard
        if (openedToAdd) {
            router.visit('/dashboard', { preserveScroll: true });
        }
    };
    const [deleteMember, setDeleteMember] = useState<Member | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [editMember, setEditMember] = useState<Member | null>(null);
    const [search, setSearch] = useState('');
    const [memberStatusTab, setMemberStatusTab] = useState(0);
    // The optional blocks of the forms: closed until asked for
    const [showContact, setShowContact] = useState(false);
    const [showParent, setShowParent] = useState(false);
    const [editShowContact, setEditShowContact] = useState(false);
    const [editShowParent, setEditShowParent] = useState(false);
    const [form, setForm] = useState({
        name: '',
        // '' = all groups: the member trains in every group
        group_id: '' as number | '',
        // '' = no subgroup
        subgroup_id: '' as number | '',
        status: 'active' as 'active' | 'inactive',
        phone: '',
        email: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
    });

    const [editForm, setEditForm] = useState({
        name: '',
        // '' = all groups: the member trains in every group
        group_id: '' as number | '',
        // '' = no subgroup
        subgroup_id: '' as number | '',
        status: 'active' as 'active' | 'inactive',
        phone: '',
        email: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
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
            editForm.parent_phone !== (editMember.parent?.phone ?? '') ||
            editForm.parent_email !== (editMember.parent?.email ?? '') ||
            editForm.phone !== (editMember.phone ?? '') ||
            editForm.email !== (editMember.email ?? ''));

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    // The server refused because the member seems to exist already
    const [duplicate, setDuplicate] = useState<DuplicateWarning | null>(null);
    // A member opened from the warning of the dashboard's "Add member" form
    const [openedFromWarning, setOpenedFromWarning] = useState(false);
    const readDuplicate = (
        errors: Record<string, string>,
        kind: DuplicateWarning['kind'],
    ) => {
        if (!errors.duplicate) {
            return;
        }

        try {
            setDuplicate({
                kind,
                matches: JSON.parse(errors.duplicate) as DuplicateMatch[],
                confirming: false,
            });
        } catch {
            // Not the expected list: nothing to show
        }
    };

    const openExisting = (match: DuplicateMatch) => {
        const existing = members.find((member) => member.id === match.id);

        if (!existing || !duplicate) {
            return;
        }

        if (duplicate.kind === 'add') {
            setShowAddModal(false);
            setOpenedFromWarning(openedToAdd);
        } else {
            setEditMember(null);
        }

        setDuplicate(null);
        setSelectedMember(existing);
    };

    // A deleted member comes back with all of their payments and attendance
    const [restoring, setRestoring] = useState(false);
    const restoreMember = (match: DuplicateMatch) => {
        if (!duplicate || restoring) {
            return;
        }

        const kind = duplicate.kind;
        setRestoring(true);
        router.post(
            `/members/${match.id}/restore`,
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const restored = (page.props.members as Member[]).find(
                        (member) => member.id === match.id,
                    );

                    if (kind === 'add') {
                        setShowAddModal(false);
                        setOpenedFromWarning(openedToAdd);
                    } else {
                        setEditMember(null);
                    }

                    setDuplicate(null);
                    setSelectedMember(restored ?? null);
                },
                onFinish: () => setRestoring(false),
            },
        );
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitAdd(false);
    };

    const submitAdd = (confirmDuplicate: boolean) => {
        router.post(
            '/members',
            { ...form, confirm_duplicate: confirmDuplicate },
            {
                onError: (errors) => readDuplicate(errors, 'add'),
                onSuccess: () => {
                    showToast(
                        t(':name was added to members', { name: form.name }),
                    );
                    setDuplicate(null);
                    closeAdd();
                    setForm({
                        name: '',
                        group_id: '',
                        subgroup_id: '',
                        status: 'active',
                        phone: '',
                        email: '',
                        parent_name: '',
                        parent_phone: '',
                        parent_email: '',
                    });
                    setShowContact(false);
                    setShowParent(false);
                },
            },
        );
    };

    const handleDeleteConfirm = () => {
        if (!deleteMember) {
            return;
        }

        setDeleting(true);
        router.delete(`/members/${deleteMember.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                const removed = deleteMember;

                if (selectedMember?.id === removed.id) {
                    setSelectedMember(null);
                }

                setDeleteMember(null);
                // The member is only hidden: Undo brings them back with their history
                showToast(
                    t(':name was deleted', { name: removed.name }),
                    'deleted',
                    () =>
                        router.post(
                            `/members/${removed.id}/restore`,
                            {},
                            { preserveScroll: true },
                        ),
                );
            },
            onFinish: () => setDeleting(false),
        });
    };

    const handleEditClick = (e: React.MouseEvent | null, member: Member) => {
        e?.stopPropagation();
        setEditMember(member);
        setEditForm({
            name: member.name,
            group_id: member.group_id ?? '',
            subgroup_id: member.subgroup_id ?? '',
            status: member.status ?? 'active',
            phone: member.phone ?? '',
            email: member.email ?? '',
            parent_name: member.parent?.name ?? '',
            parent_phone: member.parent?.phone ?? '',
            parent_email: member.parent?.email ?? '',
        });
        // Open the blocks that already hold something
        setEditShowContact(!!(member.phone || member.email));
        setEditShowParent(
            !!(
                member.parent?.name ||
                member.parent?.phone ||
                member.parent?.email
            ),
        );
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editMember) {
            return;
        }

        if (!hasEditChanges) {
            return;
        }

        submitEdit(false);
    };

    const submitEdit = (confirmDuplicate: boolean) => {
        if (!editMember) {
            return;
        }

        router.patch(
            `/members/${editMember.id}`,
            { ...editForm, confirm_duplicate: confirmDuplicate },
            {
                onError: (errors) => readDuplicate(errors, 'edit'),
                onSuccess: () => {
                    showToast(
                        t('The changes for :name were saved', {
                            name: editForm.name,
                        }),
                    );
                    setDuplicate(null);
                    setEditMember(null);
                },
            },
        );
    };

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title={t('Members')} />

            {/* Members List Modal */}
            <Dialog
                {...popup.dialogProps}
                // The "Add member" quick action shows only the form, not the list
                open={popup.dialogProps.open && !openedToAdd}
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
                            <AddButton
                                label={t('Add member')}
                                icon={<PersonAddAlt1Icon fontSize="small" />}
                                onClick={() => setShowAddModal(true)}
                            />
                        }
                        onClose={popup.close}
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
                    <PillSearchField
                        value={search}
                        onChange={setSearch}
                        placeholder={t('Search members...')}
                    />
                </DialogTitle>

                {/* Members List */}
                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    {filteredMembers.length === 0 ? (
                        <EmptyState
                            icon={<GroupsIcon />}
                            title={
                                search
                                    ? t('No members found.')
                                    : memberStatusTab === 0
                                      ? t('No active members yet')
                                      : t('No inactive members')
                            }
                        />
                    ) : (
                        <ul className="border-t border-[var(--popup-border)]">
                            {filteredMembers.map((member, index) => {
                                const paid =
                                    !!member.membership_fees_max_end_date &&
                                    !dayjs(
                                        member.membership_fees_max_end_date,
                                    ).isBefore(dayjs(), 'day');

                                return (
                                    <li
                                        key={member.id}
                                        className="border-b border-[var(--popup-border)]"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedMember(member)
                                            }
                                            className="flex w-full cursor-pointer items-center gap-3 px-[18px] py-2.5 text-left transition hover:bg-[var(--popup-ghost)]"
                                        >
                                            <Avatar sx={avatarSx(index)}>
                                                {getInitials(member.name)}
                                            </Avatar>
                                            <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-[var(--popup-fg)]">
                                                {member.name}
                                            </span>
                                            <span className="flex flex-none flex-col items-end gap-1">
                                                {member.status === 'active' && (
                                                    <PaidPill paid={paid} />
                                                )}
                                                <GroupChip
                                                    name={groupWithSubgroupName(
                                                        groups,
                                                        member.group_id,
                                                        member.subgroup_id,
                                                    )}
                                                />
                                            </span>
                                            <MoreVertIcon
                                                fontSize="small"
                                                className="flex-none text-[var(--popup-muted)]"
                                            />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Member Confirmation Modal */}
            {userRole === 'admin' && (
                <ConfirmDialog
                    open={!!deleteMember}
                    icon={<DeleteIcon fontSize="small" />}
                    title={t('Delete member?')}
                    subtitle={deleteMember?.name}
                    confirmLabel={t('Delete')}
                    busy={deleting}
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setDeleteMember(null)}
                >
                    <p>
                        {t(
                            'The member is removed from the lists. Their payments and attendance stay, so profit and reports don’t change.',
                        )}
                    </p>
                </ConfirmDialog>
            )}

            {/* Member Detail Modal */}
            <MemberDetailsDialog
                member={selectedMember}
                onEdit={(member) => handleEditClick(null, member)}
                onDelete={
                    userRole === 'admin'
                        ? (member) => setDeleteMember(member)
                        : undefined
                }
                onClose={() => {
                    setSelectedMember(null);

                    // Opened from the dashboard's "Add member": back to the dashboard
                    if (openedFromWarning) {
                        router.visit('/dashboard', { preserveScroll: true });
                    }
                }}
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
                    <PopupHeader
                        icon={<EditIcon fontSize="small" />}
                        title={t('Edit member')}
                        subtitle={editMember?.name}
                        onClose={() => setEditMember(null)}
                    />
                </DialogTitle>

                <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                    <form
                        onSubmit={handleEditSubmit}
                        className="flex flex-col gap-5 pb-2"
                    >
                        <SectionLabel>{t('Member Info')}</SectionLabel>

                        <TextField
                            label={t('Full name')}
                            value={editForm.name}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    name: e.target.value,
                                })
                            }
                            required
                            fullWidth
                            sx={FIELD_SX}
                        />

                        <OptionalSection
                            label={t('Contact details')}
                            hint={t('phone, email')}
                            open={editShowContact}
                            filled={!!(editForm.phone || editForm.email)}
                            onToggle={() =>
                                setEditShowContact(!editShowContact)
                            }
                        >
                            <TextField
                                label={t('Phone')}
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        phone: e.target.value,
                                    })
                                }
                                fullWidth
                                sx={FIELD_SX}
                            />
                            <TextField
                                label={t('Email')}
                                type="email"
                                value={editForm.email}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        email: e.target.value,
                                    })
                                }
                                fullWidth
                                sx={FIELD_SX}
                            />
                        </OptionalSection>

                        <FormControl fullWidth>
                            <InputLabel
                                id="edit-pool-label"
                                shrink
                                sx={{ color: popupFg(0.5) }}
                            >
                                {t('Group')}
                            </InputLabel>
                            <Select
                                labelId="edit-pool-label"
                                value={editForm.group_id}
                                displayEmpty
                                notched
                                label={t('Group')}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        group_id:
                                            String(e.target.value) === ''
                                                ? ''
                                                : Number(e.target.value),
                                        // Subgroups belong to one group
                                        subgroup_id: '',
                                    })
                                }
                                sx={SELECT_SX}
                            >
                                <MenuItem value="">{t('All groups')}</MenuItem>
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

                        <StatusRow
                            active={editForm.status === 'active'}
                            onChange={(active) =>
                                setEditForm({
                                    ...editForm,
                                    status: active ? 'active' : 'inactive',
                                })
                            }
                        />

                        <OptionalSection
                            label={t('Parent Info')}
                            hint={t('name, phone, email')}
                            open={editShowParent}
                            filled={
                                !!(
                                    editForm.parent_name ||
                                    editForm.parent_phone ||
                                    editForm.parent_email
                                )
                            }
                            onToggle={() => setEditShowParent(!editShowParent)}
                        >
                            <TextField
                                label={t('Parent full name')}
                                value={editForm.parent_name}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        parent_name: e.target.value,
                                    })
                                }
                                fullWidth
                                sx={FIELD_SX}
                            />
                            <TextField
                                label={t('Parent phone')}
                                type="tel"
                                value={editForm.parent_phone}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        parent_phone: e.target.value,
                                    })
                                }
                                fullWidth
                                sx={FIELD_SX}
                            />
                            <TextField
                                label={t('Parent email')}
                                type="email"
                                value={editForm.parent_email}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        parent_email: e.target.value,
                                    })
                                }
                                fullWidth
                                sx={FIELD_SX}
                            />
                        </OptionalSection>

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
                                {t('Save')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Member Modal */}
            {showAddModal && (
                <Dialog
                    open={showAddModal}
                    onClose={closeAdd}
                    disableRestoreFocus
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{ sx: { bgcolor: POPUP_BG } }}
                >
                    <DialogTitle sx={{ p: 0 }}>
                        <PopupHeader
                            icon={<PersonAddAlt1Icon fontSize="small" />}
                            title={t('Add member')}
                            subtitle={t('A new member of the club')}
                            onClose={closeAdd}
                        />
                    </DialogTitle>

                    <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                        <form
                            onSubmit={handleAddSubmit}
                            className="flex flex-col gap-5 pb-2"
                        >
                            <SectionLabel>{t('Member Info')}</SectionLabel>

                            <TextField
                                label={t('Full name')}
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                required
                                fullWidth
                                sx={FIELD_SX}
                            />

                            <OptionalSection
                                label={t('Contact details')}
                                hint={t('phone, email')}
                                open={showContact}
                                filled={!!(form.phone || form.email)}
                                onToggle={() => setShowContact(!showContact)}
                            >
                                <TextField
                                    label={t('Phone')}
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            phone: e.target.value,
                                        })
                                    }
                                    fullWidth
                                    sx={FIELD_SX}
                                />
                                <TextField
                                    label={t('Email')}
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            email: e.target.value,
                                        })
                                    }
                                    fullWidth
                                    sx={FIELD_SX}
                                />
                            </OptionalSection>

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
                                    shrink
                                    sx={{ color: popupFg(0.5) }}
                                >
                                    {t('Group')}
                                </InputLabel>
                                <Select
                                    labelId="pool-label"
                                    value={form.group_id}
                                    displayEmpty
                                    notched
                                    label={t('Group')}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            group_id:
                                                String(e.target.value) === ''
                                                    ? ''
                                                    : Number(e.target.value),
                                            // Subgroups belong to one group
                                            subgroup_id: '',
                                        })
                                    }
                                    sx={SELECT_SX}
                                >
                                    <MenuItem value="">
                                        {t('All groups')}
                                    </MenuItem>
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

                            <StatusRow
                                active={form.status === 'active'}
                                onChange={(active) =>
                                    setForm({
                                        ...form,
                                        status: active ? 'active' : 'inactive',
                                    })
                                }
                            />

                            <OptionalSection
                                label={t('Parent Info')}
                                hint={t('name, phone, email')}
                                open={showParent}
                                filled={
                                    !!(
                                        form.parent_name ||
                                        form.parent_phone ||
                                        form.parent_email
                                    )
                                }
                                onToggle={() => setShowParent(!showParent)}
                            >
                                <TextField
                                    label={t('Parent full name')}
                                    value={form.parent_name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            parent_name: e.target.value,
                                        })
                                    }
                                    fullWidth
                                    sx={FIELD_SX}
                                />
                                <TextField
                                    label={t('Parent phone')}
                                    type="tel"
                                    value={form.parent_phone}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            parent_phone: e.target.value,
                                        })
                                    }
                                    fullWidth
                                    sx={FIELD_SX}
                                />
                                <TextField
                                    label={t('Parent email')}
                                    type="email"
                                    value={form.parent_email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            parent_email: e.target.value,
                                        })
                                    }
                                    fullWidth
                                    sx={FIELD_SX}
                                />
                            </OptionalSection>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    onClick={closeAdd}
                                >
                                    {t('Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    size="medium"
                                >
                                    {t('Save')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* The same member seems to exist already: open it, or (asked twice) save anyway */}
            <Dialog
                open={!!duplicate}
                onClose={() => setDuplicate(null)}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<WarningAmberIcon fontSize="small" />}
                        title={
                            duplicate?.confirming
                                ? duplicate.kind === 'add'
                                    ? t('Add a new member anyway?')
                                    : t('Save anyway?')
                                : t('This member already exists')
                        }
                        onClose={() => setDuplicate(null)}
                    />
                </DialogTitle>
                <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                    {duplicate && !duplicate.confirming && (
                        <div className="flex flex-col gap-4 pb-2">
                            <Typography
                                variant="body2"
                                sx={{ color: popupFg(0.75) }}
                            >
                                {t(
                                    'A member with the same name and the same phone, email or parent is already in the club:',
                                )}
                            </Typography>
                            {duplicate.matches.map((match) => (
                                <div
                                    key={match.id}
                                    className="flex flex-col gap-3 rounded-2xl border border-[var(--popup-border)] p-3"
                                >
                                    <div>
                                        <Typography fontWeight="bold">
                                            {match.name}
                                            {match.deleted
                                                ? ` · ${t('Deleted')}`
                                                : match.status === 'inactive' &&
                                                  ` · ${t('Inactive')}`}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: popupFg(0.7) }}
                                        >
                                            {match.group ?? t('All groups')}
                                            {match.parent &&
                                                ` · ${t('Parent: :name', { name: match.parent })}`}
                                        </Typography>
                                    </div>
                                    {match.canOpen && match.deleted ? (
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            size="medium"
                                            disabled={restoring}
                                            onClick={() => restoreMember(match)}
                                        >
                                            {t('Bring them back')}
                                        </Button>
                                    ) : match.canOpen ? (
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            size="medium"
                                            onClick={() => openExisting(match)}
                                        >
                                            {t('Open existing')}
                                        </Button>
                                    ) : (
                                        <Typography
                                            variant="body2"
                                            sx={{ color: popupFg(0.7) }}
                                        >
                                            {t(
                                                'This member is in a group you don’t see. Ask an admin.',
                                            )}
                                        </Typography>
                                    )}
                                </div>
                            ))}
                            <Button
                                variant="text"
                                fullWidth
                                size="medium"
                                onClick={() =>
                                    setDuplicate({
                                        ...duplicate,
                                        confirming: true,
                                    })
                                }
                            >
                                {duplicate.kind === 'add'
                                    ? t('It’s a different member, add anyway')
                                    : t('It’s a different member, save anyway')}
                            </Button>
                        </div>
                    )}
                    {duplicate?.confirming && (
                        <div className="flex flex-col gap-4 pb-2">
                            <Typography
                                variant="body2"
                                sx={{ color: popupFg(0.75) }}
                            >
                                {t(
                                    'The club will have two members with the same name and the same contact. Do this only if they really are two different people.',
                                )}
                            </Typography>
                            <div className="flex gap-3">
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    onClick={() =>
                                        setDuplicate({
                                            ...duplicate,
                                            confirming: false,
                                        })
                                    }
                                >
                                    {t('Back')}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="warning"
                                    fullWidth
                                    size="medium"
                                    onClick={() =>
                                        duplicate.kind === 'add'
                                            ? submitAdd(true)
                                            : submitEdit(true)
                                    }
                                >
                                    {duplicate.kind === 'add'
                                        ? t('Yes, add')
                                        : t('Yes, save')}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
}

const SELECT_SX = {
    color: POPUP_FG,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: popupFg(0.3) },
    '& .MuiSvgIcon-root': { color: POPUP_FG },
} as const;

/** A small all-caps heading of a form section. */
function SectionLabel({ children }: { children: ReactNode }) {
    return (
        <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: -1.5 }}
        >
            {children}
        </Typography>
    );
}

/**
 * An optional part of a form: a dashed "+ add" button that opens its fields, so
 * clubs that don't need it never see the empty fields.
 */
function OptionalSection({
    label,
    hint,
    open,
    filled,
    onToggle,
    children,
}: {
    label: string;
    hint: string;
    open: boolean;
    /** Something is typed in it (shown while it's closed). */
    filled: boolean;
    onToggle: () => void;
    children: ReactNode;
}) {
    if (!open) {
        return (
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={false}
                className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--popup-border)] px-3.5 py-2.5 text-left text-sm text-hydra-blue transition hover:bg-hydra-blue/10 dark:text-sky-300"
            >
                <AddIcon fontSize="small" />
                <span>
                    <span className="font-semibold">{label}</span>{' '}
                    <span className="text-[var(--popup-muted)]">
                        ({filled ? t('filled in') : hint})
                    </span>
                </span>
            </button>
        );
    }

    // Open: the heading closes it again (what was typed is kept)
    return (
        <>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded
                aria-label={t('Hide :name', { name: label })}
                className="-mb-1.5 flex min-h-8 w-full cursor-pointer items-center justify-between text-left text-xs tracking-wider text-[var(--popup-muted)] uppercase"
            >
                {label}
                <ExpandLessIcon fontSize="small" />
            </button>
            {children}
        </>
    );
}

/** Active / inactive, as one row with an explanation and the switch. */
function StatusRow({
    active,
    onChange,
}: {
    active: boolean;
    onChange: (active: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-[var(--popup-ghost)] px-3.5 py-2.5">
            <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--popup-fg)]">
                    {t('Status')}
                </span>
                <span className="block text-xs text-[var(--popup-muted)]">
                    {active
                        ? t('Active members train and pay')
                        : t("Inactive members don't train for now")}
                </span>
            </span>
            <span className="flex flex-none items-center gap-1">
                <span
                    className={`text-sm font-semibold ${active ? 'text-green-500' : 'text-[var(--popup-muted)]'}`}
                >
                    {active ? t('Active') : t('Inactive')}
                </span>
                <Switch
                    checked={active}
                    onChange={(e) => onChange(e.target.checked)}
                />
            </span>
        </label>
    );
}

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
