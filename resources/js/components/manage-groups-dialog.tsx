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
import { useEffect, useRef, useState } from 'react';
import {
    GroupMembersDialog,
    MembersLink,
} from '@/components/group-members-dialog';
import type { MembersOf } from '@/components/group-members-dialog';
import type { MemberDetails } from '@/components/member-details-dialog';
import { POPUP_BG } from '@/components/mui-theme-provider';
import { CloseButton, PopupHeader, SlidingText } from '@/components/popup-ui';
import type { ClubGroup, ClubSubgroup } from '@/lib/groups';
import { t, tc } from '@/lib/i18n';

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
    tc(':count member|:count members', count);

/** What is being deleted: a main group, or a subgroup of `parent`. */
type Deleting = { item: ClubSubgroup; parent: ClubGroup | null };

/** A destination for the members of a deleted group or subgroup. */
/** Where members go: a group, a subgroup, or 'all' (all groups: no single group). */
type Destination = { id: number | 'all'; label: string };

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
    /** The club's active members, for the "N members" lists. */
    members: MemberDetails[];
}) {
    // The group or subgroup whose members are being listed
    const [membersOf, setMembersOf] = useState<MembersOf | null>(null);
    // How many active members a group or subgroup has (the lists show only those)
    const activeIn = (kind: MembersOf['kind'], id: number) =>
        members.filter((member) =>
            kind === 'group'
                ? member.group_id === id || member.group_id === null
                : member.subgroup_id === id,
        ).length;
    const [newName, setNewName] = useState('');
    const [names, setNames] = useState<Record<number, string>>({});
    // The group a new subgroup is being added to, and its name so far
    const [addingTo, setAddingTo] = useState<number | null>(null);
    const [newSubgroupName, setNewSubgroupName] = useState('');
    const [deleting, setDeleting] = useState<Deleting | null>(null);
    const [moveTo, setMoveTo] = useState<number | 'all' | ''>('');
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
            onError(Object.values(errors)[0] ?? t('Something went wrong.')),
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

    // On phones, bring the new subgroup's field to the middle of the screen once
    // it opens and the keyboard has come up
    const newSubgroupRef = useRef<HTMLLIElement>(null);
    useEffect(() => {
        if (
            addingTo === null ||
            !window.matchMedia('(pointer: coarse)').matches
        ) {
            return;
        }

        const timer = window.setTimeout(
            () =>
                newSubgroupRef.current?.scrollIntoView({
                    block: 'center',
                    behavior: 'smooth',
                }),
            350,
        );

        return () => window.clearTimeout(timer);
    }, [addingTo]);

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

    /**
     * Where the members of what is being deleted can go: all groups (always there,
     * so even the last group can be deleted), or another group or subgroup.
     */
    const destinationsFor = (target: Deleting): Destination[] => [
        { id: 'all', label: t('All groups') },
        ...groups.flatMap((group) => {
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
        }),
    ];

    const startDelete = (item: ClubSubgroup, parent: ClubGroup | null) => {
        const target = { item, parent };

        setDeleting(target);
        // A subgroup's members go back to its group, a group's to the next group,
        // unless chosen otherwise; the last group's to all groups
        setMoveTo(
            parent?.id ??
                destinationsFor(target).find((d) => d.id !== 'all')?.id ??
                'all',
        );
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
                    <Tooltip title={t('Save name')}>
                        <IconButton
                            color="primary"
                            aria-label={t('Save name of :name', {
                                name: item.name,
                            })}
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
                        title={t('Groups')}
                        subtitle={t(
                            'Groups and their subgroups, e.g. Big pool → 18:00',
                        )}
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
                                placeholder={t('New group name')}
                                inputProps={{
                                    'aria-label': t('New group name'),
                                    maxLength: 60,
                                }}
                                sx={fieldSx}
                            />
                            <Tooltip title={t('Add group')}>
                                {/* A disabled button needs a wrapper for its hint */}
                                <span className="flex-none">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        aria-label={t('Add group')}
                                        disabled={busy || newName.trim() === ''}
                                        sx={{
                                            minWidth: 0,
                                            px: 1.25,
                                            height: 40,
                                        }}
                                    >
                                        <AddIcon />
                                    </Button>
                                </span>
                            </Tooltip>
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
                                {t('No groups yet. Add the first one above.')}
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
                                            t('Name of group :name', {
                                                name: group.name,
                                            }),
                                        )}
                                        <Tooltip title={t('Add subgroup')}>
                                            <IconButton
                                                color="primary"
                                                aria-label={t(
                                                    'Add subgroup to :name',
                                                    { name: group.name },
                                                )}
                                                disabled={busy}
                                                onClick={() =>
                                                    startSubgroup(group)
                                                }
                                            >
                                                <AddCircleIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={t('Delete group')}>
                                            <IconButton
                                                color="error"
                                                aria-label={t(
                                                    'Delete group :name',
                                                    { name: group.name },
                                                )}
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
                                            count={activeIn('group', group.id)}
                                            onClick={() =>
                                                setMembersOf({
                                                    kind: 'group',
                                                    id: group.id,
                                                    title: group.name,
                                                })
                                            }
                                        />
                                        {group.subgroups.length > 0 &&
                                            ` · ${tc(':count subgroup|:count subgroups', group.subgroups.length)}`}
                                    </p>

                                    {(group.subgroups.length > 0 ||
                                        addingTo === group.id) && (
                                        <ul className="mt-2.5 ml-3 flex flex-col gap-2 border-l-2 border-[var(--popup-border)] pl-3">
                                            {group.subgroups.map((subgroup) => (
                                                <li key={subgroup.id}>
                                                    <div className="flex items-center gap-1.5">
                                                        {renameField(
                                                            subgroup,
                                                            t(
                                                                'Name of subgroup :subgroup of :group',
                                                                {
                                                                    subgroup:
                                                                        subgroup.name,
                                                                    group: group.name,
                                                                },
                                                            ),
                                                        )}
                                                        <Tooltip
                                                            title={t(
                                                                'Delete subgroup',
                                                            )}
                                                        >
                                                            <IconButton
                                                                color="error"
                                                                aria-label={t(
                                                                    'Delete subgroup :subgroup of :group',
                                                                    {
                                                                        subgroup:
                                                                            subgroup.name,
                                                                        group: group.name,
                                                                    },
                                                                )}
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
                                                            count={activeIn(
                                                                'subgroup',
                                                                subgroup.id,
                                                            )}
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
                                                <li ref={newSubgroupRef}>
                                                    <form
                                                        className="flex items-center gap-1.5"
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            addSubgroup(group);
                                                        }}
                                                    >
                                                        <div className="relative min-w-0 flex-1">
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
                                                                inputProps={{
                                                                    'aria-label':
                                                                        t(
                                                                            'New subgroup name for :name',
                                                                            {
                                                                                name: group.name,
                                                                            },
                                                                        ),
                                                                    maxLength: 60,
                                                                }}
                                                                sx={fieldSx}
                                                            />
                                                            {/* The hint, sliding to show all of it when the field is narrow */}
                                                            {newSubgroupName ===
                                                                '' && (
                                                                <SlidingText className="pointer-events-none absolute inset-y-0 right-[15px] left-[15px] flex items-center text-sm text-[var(--popup-muted)] pointer-coarse:text-base">
                                                                    {t(
                                                                        'New subgroup name, e.g. 18:00',
                                                                    )}
                                                                </SlidingText>
                                                            )}
                                                        </div>
                                                        <Tooltip
                                                            title={t(
                                                                'Add subgroup',
                                                            )}
                                                        >
                                                            <span>
                                                                <IconButton
                                                                    type="submit"
                                                                    color="primary"
                                                                    aria-label={t(
                                                                        'Save subgroup',
                                                                    )}
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
                                                        <Tooltip
                                                            title={t('Cancel')}
                                                        >
                                                            <IconButton
                                                                aria-label={t(
                                                                    'Cancel new subgroup',
                                                                )}
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
                                ? t('Delete Subgroup')
                                : t('Delete Group')}
                        </Typography>
                        <CloseButton onClick={closeDelete} />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent>
                    {deleting && (
                        <div className="flex flex-col gap-4 py-4">
                            <Typography variant="body1">
                                {t('Are you sure you want to delete')}{' '}
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
                                    {t(
                                        'Its subgroups (:names) will be deleted too.',
                                        {
                                            names: deletingSubgroups
                                                .map((s) => s.name)
                                                .join(', '),
                                        },
                                    )}
                                </Typography>
                            )}

                            {needsMove &&
                                (destinations.length > 0 ? (
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="move-members-label">
                                            {t('Move its :members to', {
                                                members: membersLabel(
                                                    deleting.item.members_count,
                                                ),
                                            })}
                                        </InputLabel>
                                        <Select
                                            labelId="move-members-label"
                                            label={t('Move its :members to', {
                                                members: membersLabel(
                                                    deleting.item.members_count,
                                                ),
                                            })}
                                            value={moveTo}
                                            onChange={(e) =>
                                                setMoveTo(
                                                    e.target.value === 'all'
                                                        ? 'all'
                                                        : Number(
                                                              e.target.value,
                                                          ),
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
                                        {t(
                                            'Add another group first, so its members have somewhere to go.',
                                        )}
                                    </Typography>
                                ))}

                            <Typography variant="body2" color="text.secondary">
                                {t(
                                    'Past trainings, payments and invoices keep its name.',
                                )}
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
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    onClick={closeDelete}
                                    disabled={busy}
                                >
                                    {t('No')}
                                </Button>
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
                                    {t('Yes')}
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
