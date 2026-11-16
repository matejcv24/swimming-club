import { router } from '@inertiajs/react';
import AddIcon from '@mui/icons-material/Add';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupsIcon from '@mui/icons-material/Groups';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import type { DialogProps } from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import {
    GroupMembersDialog,
    MembersLink,
} from '@/components/group-members-dialog';
import type { MembersOf } from '@/components/group-members-dialog';
import type { MemberDetails } from '@/components/member-details-dialog';
import { POPUP_BG } from '@/components/mui-theme-provider';
import { CloseButton, PopupHeader } from '@/components/popup-ui';
import type { ClubGroup, ClubSubgroup } from '@/lib/groups';

const fieldSx = {
    height: 40,
    px: 1.75,
    borderRadius: 999,
    bgcolor: 'var(--popup-ghost)',
    border: '1px solid var(--popup-border)',
    color: 'var(--popup-fg)',
    fontSize: 14,
    '& input::placeholder': { color: 'var(--popup-muted)', opacity: 1 },
    '&.Mui-focused': { borderColor: '#1690c8' },
};

const visitOptions = { preserveScroll: true, preserveState: true } as const;

const membersLabel = (count: number) =>
    `${count} ${count === 1 ? 'member' : 'members'}`;

/** What is being deleted: a main group, or a subgroup of `parent`. */
type Deleting = { item: ClubSubgroup; parent: ClubGroup | null };

/** A destination for the members of a deleted group or subgroup. */
type Destination = { id: number; label: string };

/**
 * Admins create, rename and delete the club's groups (e.g. "Big pool") and their
 * subgroups (e.g. "18:00"). Deleting one that has members first moves them to
 * another group or subgroup.
 */
export function ManageGroupsDialog({
    open,
    onClose,
    groups,
    members,
    transition,
}: {
    open: boolean;
    /** The page pop-up's fade (see usePagePopup). */
    transition?: Pick<DialogProps, 'transitionDuration' | 'TransitionProps'>;
    onClose: () => void;
    groups: ClubGroup[];
    /** Everyone in the club, for the "N members" lists. */
    members: MemberDetails[];
}) {
    // The group or subgroup whose members are being listed
    const [membersOf, setMembersOf] = useState<MembersOf | null>(null);
    const [newName, setNewName] = useState('');
    const [names, setNames] = useState<Record<number, string>>({});
    // The group a new subgroup is being added to, and its name so far
    const [addingTo, setAddingTo] = useState<number | null>(null);
    const [newSubgroupName, setNewSubgroupName] = useState('');
    const [deleting, setDeleting] = useState<Deleting | null>(null);
    const [moveTo, setMoveTo] = useState<number | ''>('');
    const [error, setError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const nameOf = (item: ClubSubgroup) => names[item.id] ?? item.name;

    const visit = (onError: (message: string) => void) => ({
        ...visitOptions,
        onStart: () => {
            setBusy(true);
            setError(null);
            setDeleteError(null);
        },
        onError: (errors: Record<string, string>) =>
            onError(Object.values(errors)[0] ?? 'Something went wrong.'),
        onFinish: () => setBusy(false),
    });

    const addGroup = () => {
        if (newName.trim() === '') {
            return;
        }

        router.post(
            '/groups',
            { name: newName.trim() },
            { ...visit(setError), onSuccess: () => setNewName('') },
        );
    };

    const startSubgroup = (group: ClubGroup) => {
        setAddingTo(group.id);
        setNewSubgroupName('');
        setError(null);
    };

    const addSubgroup = (group: ClubGroup) => {
        if (newSubgroupName.trim() === '') {
            return;
        }

        router.post(
            '/groups',
            { name: newSubgroupName.trim(), parent_id: group.id },
            {
                ...visit(setError),
                onSuccess: () => {
                    setAddingTo(null);
                    setNewSubgroupName('');
                },
            },
        );
    };

    const rename = (item: ClubSubgroup) => {
        router.put(
            `/groups/${item.id}`,
            { name: nameOf(item).trim() },
            {
                ...visit(setError),
                onSuccess: () =>
                    setNames((current) => {
                        const rest = { ...current };
                        delete rest[item.id];

                        return rest;
                    }),
            },
        );
    };

    /** Where the members of what is being deleted can go. */
    const destinationsFor = (target: Deleting): Destination[] =>
        groups.flatMap((group) => {
            // A deleted group takes its subgroups with it
            if (target.parent === null && group.id === target.item.id) {
                return [];
            }

            return [
                { id: group.id, label: group.name },
                ...group.subgroups
                    .filter((s) => s.id !== target.item.id)
                    .map((s) => ({
                        id: s.id,
                        label: `${group.name} · ${s.name}`,
                    })),
            ];
        });

    const startDelete = (item: ClubSubgroup, parent: ClubGroup | null) => {
        const target = { item, parent };

        setDeleting(target);
        // A subgroup's members go back to its group unless chosen otherwise
        setMoveTo(parent?.id ?? destinationsFor(target)[0]?.id ?? '');
        setDeleteError(null);
    };

    const closeDelete = () => {
        if (!busy) {
            setDeleting(null);
        }
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        router.delete(`/groups/${deleting.item.id}`, {
            ...visit(setDeleteError),
            data:
                deleting.item.members_count > 0
                    ? { move_to_group_id: moveTo }
                    : {},
            onSuccess: () => setDeleting(null),
        });
    };

    const renameField = (item: ClubSubgroup, label: string) => {
        const changed =
            nameOf(item).trim() !== item.name && nameOf(item).trim() !== '';

        return (
            <>
                <InputBase
                    fullWidth
                    value={nameOf(item)}
                    onChange={(e) =>
                        setNames({ ...names, [item.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && changed) {
                            rename(item);
                        }
                    }}
                    inputProps={{ 'aria-label': label, maxLength: 60 }}
                    sx={fieldSx}
                />
                {changed && (
                    <Tooltip title="Save name">
                        <IconButton
                            color="primary"
                            aria-label={`Save name of ${item.name}`}
                            disabled={busy}
                            onClick={() => rename(item)}
                        >
                            <CheckIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </>
        );
    };

    const destinations = deleting ? destinationsFor(deleting) : [];
    const deletingSubgroups =
        deleting && deleting.parent === null
            ? (groups.find((g) => g.id === deleting.item.id)?.subgroups ?? [])
            : [];
    const needsMove = (deleting?.item.members_count ?? 0) > 0;

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                {...transition}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: POPUP_BG, maxHeight: '85vh' } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<GroupsIcon fontSize="small" />}
                        title="Groups"
                        subtitle="Groups and their subgroups, e.g. Big pool → 18:00"
                        onClose={onClose}
                    />
                </DialogTitle>

                <DialogContent sx={{ px: 2.25, pb: 2.25 }}>
                    <div className="flex flex-col gap-4">
                        {/* Add a group */}
                        <form
                            className="flex items-center gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                addGroup();
                            }}
                        >
                            <InputBase
                                fullWidth
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="New group name"
                                inputProps={{
                                    'aria-label': 'New group name',
                                    maxLength: 60,
                                }}
                                sx={fieldSx}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<AddIcon />}
                                disabled={busy || newName.trim() === ''}
                                sx={{ flex: 'none' }}
                            >
                                Add
                            </Button>
                        </form>

                        {error && (
                            <p
                                role="alert"
                                className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500"
                            >
                                {error}
                            </p>
                        )}

                        {groups.length === 0 && (
                            <p className="py-6 text-center text-sm text-[var(--popup-muted)]">
                                No groups yet. Add the first one above.
                            </p>
                        )}

                        {/* The club's groups and their subgroups */}
                        <ul className="flex flex-col gap-2">
                            {groups.map((group) => (
                                <li
                                    key={group.id}
                                    className="rounded-2xl border border-[var(--popup-border)] p-3"
                                >
                                    <div className="flex items-center gap-1.5">
                                        {renameField(
                                            group,
                                            `Name of group ${group.name}`,
                                        )}
                                        <Tooltip title="Add subgroup">
                                            <IconButton
                                                color="primary"
                                                aria-label={`Add subgroup to ${group.name}`}
                                                disabled={busy}
                                                onClick={() =>
                                                    startSubgroup(group)
                                                }
                                            >
                                                <AddCircleIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete group">
                                            <IconButton
                                                color="error"
                                                aria-label={`Delete group ${group.name}`}
                                                disabled={busy}
                                                onClick={() =>
                                                    startDelete(group, null)
                                                }
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </div>
                                    <p className="mt-1.5 px-1 text-xs text-[var(--popup-muted)]">
                                        <MembersLink
                                            count={group.members_count}
                                            onClick={() =>
                                                setMembersOf({
                                                    kind: 'group',
                                                    id: group.id,
                                                    title: group.name,
                                                })
                                            }
                                        />
                                        {group.subgroups.length > 0 &&
                                            ` · ${group.subgroups.length} ${
                                                group.subgroups.length === 1
                                                    ? 'subgroup'
                                                    : 'subgroups'
                                            }`}
                                    </p>

                                    {(group.subgroups.length > 0 ||
                                        addingTo === group.id) && (
                                        <ul className="mt-2.5 ml-3 flex flex-col gap-2 border-l-2 border-[var(--popup-border)] pl-3">
                                            {group.subgroups.map((subgroup) => (
                                                <li key={subgroup.id}>
                                                    <div className="flex items-center gap-1.5">
                                                        {renameField(
                                                            subgroup,
                                                            `Name of subgroup ${subgroup.name} of ${group.name}`,
                                                        )}
                                                        <Tooltip title="Delete subgroup">
                                                            <IconButton
                                                                color="error"
                                                                aria-label={`Delete subgroup ${subgroup.name} of ${group.name}`}
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    startDelete(
                                                                        subgroup,
                                                                        group,
                                                                    )
                                                                }
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </div>
                                                    <p className="mt-1 px-1 text-xs text-[var(--popup-muted)]">
                                                        <MembersLink
                                                            count={
                                                                subgroup.members_count
                                                            }
                                                            onClick={() =>
                                                                setMembersOf({
                                                                    kind: 'subgroup',
                                                                    id: subgroup.id,
                                                                    title: `${group.name} · ${subgroup.name}`,
                                                                })
                                                            }
                                                        />
                                                    </p>
                                                </li>
                                            ))}

                                            {/* New subgroup */}
                                            {addingTo === group.id && (
                                                <li>
                                                    <form
                                                        className="flex items-center gap-1.5"
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            addSubgroup(group);
                                                        }}
                                                    >
                                                        <InputBase
                                                            fullWidth
                                                            autoFocus
                                                            value={
                                                                newSubgroupName
                                                            }
                                                            onChange={(e) =>
                                                                setNewSubgroupName(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="New subgroup name, e.g. 18:00"
                                                            inputProps={{
                                                                'aria-label': `New subgroup name for ${group.name}`,
                                                                maxLength: 60,
                                                            }}
                                                            sx={fieldSx}
                                                        />
                                                        <Tooltip title="Add subgroup">
                                                            <span>
                                                                <IconButton
                                                                    type="submit"
                                                                    color="primary"
                                                                    aria-label="Save subgroup"
                                                                    disabled={
                                                                        busy ||
                                                                        newSubgroupName.trim() ===
                                                                            ''
                                                                    }
                                                                >
                                                                    <CheckIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip title="Cancel">
                                                            <IconButton
                                                                aria-label="Cancel new subgroup"
                                                                onClick={() =>
                                                                    setAddingTo(
                                                                        null,
                                                                    )
                                                                }
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </form>
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Group Confirmation Modal */}
            <Dialog
                open={!!deleting}
                onClose={closeDelete}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            {deleting?.parent
                                ? 'Delete Subgroup'
                                : 'Delete Group'}
                        </Typography>
                        <CloseButton onClick={closeDelete} />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent>
                    {deleting && (
                        <div className="flex flex-col gap-4 py-4">
                            <Typography variant="body1">
                                Are you sure you want to delete{' '}
                                <strong>
                                    {deleting.parent
                                        ? `${deleting.parent.name} · ${deleting.item.name}`
                                        : deleting.item.name}
                                </strong>
                                ?
                            </Typography>

                            {deletingSubgroups.length > 0 && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Its subgroups (
                                    {deletingSubgroups
                                        .map((s) => s.name)
                                        .join(', ')}
                                    ) will be deleted too.
                                </Typography>
                            )}

                            {needsMove &&
                                (destinations.length > 0 ? (
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="move-members-label">
                                            Move its{' '}
                                            {membersLabel(
                                                deleting.item.members_count,
                                            )}{' '}
                                            to
                                        </InputLabel>
                                        <Select
                                            labelId="move-members-label"
                                            label={`Move its ${membersLabel(deleting.item.members_count)} to`}
                                            value={moveTo}
                                            onChange={(e) =>
                                                setMoveTo(
                                                    Number(e.target.value),
                                                )
                                            }
                                        >
                                            {destinations.map((d) => (
                                                <MenuItem
                                                    key={d.id}
                                                    value={d.id}
                                                >
                                                    {d.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <Typography variant="body2" color="error">
                                        Add another group first, so its members
                                        have somewhere to go.
                                    </Typography>
                                ))}

                            <Typography variant="body2" color="text.secondary">
                                Past trainings, payments and invoices keep its
                                name.
                            </Typography>

                            {deleteError && (
                                <Typography
                                    variant="body2"
                                    color="error"
                                    role="alert"
                                >
                                    {deleteError}
                                </Typography>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="contained"
                                    color="error"
                                    fullWidth
                                    size="medium"
                                    onClick={confirmDelete}
                                    disabled={
                                        busy ||
                                        (needsMove &&
                                            (destinations.length === 0 ||
                                                moveTo === ''))
                                    }
                                >
                                    Yes
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    onClick={closeDelete}
                                    disabled={busy}
                                >
                                    No
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <GroupMembersDialog
                of={membersOf}
                members={members}
                onClose={() => setMembersOf(null)}
            />
        </>
    );
}
