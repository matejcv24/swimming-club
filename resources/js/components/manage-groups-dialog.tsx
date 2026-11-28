import { router } from '@inertiajs/react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PeopleIcon from '@mui/icons-material/People';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import type { DialogProps } from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { GroupMembersDialog } from '@/components/group-members-dialog';
import type { MembersOf } from '@/components/group-members-dialog';
import type { MemberDetails } from '@/components/member-details-dialog';
import { POPUP_BG } from '@/components/mui-theme-provider';
import {
    ActionMenu,
    ConfirmDialog,
    EmptyState,
    FIELD_SX,
    Note,
    PopupButtons,
    PopupHeader,
} from '@/components/popup-ui';
import type { ClubGroup, ClubSubgroup } from '@/lib/groups';
import { t, tc } from '@/lib/i18n';
import { showToast } from '@/lib/toast';

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
    // Adding a group or a time slot, or renaming one: a small form with one field
    const [editor, setEditor] = useState<{
        mode: 'group' | 'subgroup' | 'rename';
        /** The group a new time slot goes into */
        group?: ClubGroup;
        /** What is being renamed */
        item?: ClubSubgroup;
        value: string;
    } | null>(null);
    // The group or time slot whose ⋮ menu is open
    const [menuFor, setMenuFor] = useState<Deleting | null>(null);
    const [deleting, setDeleting] = useState<Deleting | null>(null);
    const [moveTo, setMoveTo] = useState<number | 'all' | ''>('');
    const [error, setError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

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

    const openEditor = (
        mode: 'group' | 'subgroup' | 'rename',
        options: { group?: ClubGroup; item?: ClubSubgroup } = {},
    ) => {
        setError(null);
        setEditor({ mode, ...options, value: options.item?.name ?? '' });
    };

    const saveEditor = () => {
        if (!editor || editor.value.trim() === '') {
            return;
        }

        const name = editor.value.trim();
        const done = (message: string) => () => {
            setEditor(null);
            showToast(message);
        };

        if (editor.mode === 'rename' && editor.item) {
            router.put(
                `/groups/${editor.item.id}`,
                { name },
                {
                    ...visit(setError),
                    onSuccess: done(t('The name was saved')),
                },
            );
        } else if (editor.mode === 'subgroup' && editor.group) {
            router.post(
                '/groups',
                { name, parent_id: editor.group.id },
                {
                    ...visit(setError),
                    onSuccess: done(
                        t('The time slot :name was added to :group', {
                            name,
                            group: editor.group.name,
                        }),
                    ),
                },
            );
        } else {
            router.post(
                '/groups',
                { name },
                {
                    ...visit(setError),
                    onSuccess: done(
                        t('The group :name was added', { name }),
                    ),
                },
            );
        }
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
            onSuccess: () => {
                showToast(
                    t('Deleted: :name', { name: deleting.item.name }),
                    'deleted',
                );
                setDeleting(null);
            },
        });
    };

    const destinations = deleting ? destinationsFor(deleting) : [];
    const deletingSubgroups =
        deleting && deleting.parent === null
            ? (groups.find((g) => g.id === deleting.item.id)?.subgroups ?? [])
            : [];
    const needsMove = (deleting?.item.members_count ?? 0) > 0;

    const editorTitle = !editor
        ? ''
        : editor.mode === 'rename'
          ? t('Rename')
          : editor.mode === 'subgroup'
            ? t('New time slot')
            : t('New group');

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
                <PopupHeader
                    icon={<GroupsIcon fontSize="small" />}
                    title={t('Groups')}
                    subtitle={`${tc(':count group|:count groups', groups.length)} · ${tc(
                        ':count subgroup|:count subgroups',
                        groups.reduce(
                            (count, group) => count + group.subgroups.length,
                            0,
                        ),
                    )}`}
                    onClose={onClose}
                />

                {/* Adding is always in sight, never in a menu */}
                <div className="px-[18px] pb-3">
                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={() => openEditor('group')}
                    >
                        {t('New group')}
                    </Button>
                </div>

                <DialogContent sx={{ p: 0 }}>
                    {groups.length === 0 ? (
                        <EmptyState
                            icon={<GroupsIcon />}
                            title={t('No groups yet')}
                            text={t(
                                'Add the first one, e.g. by age or level.',
                            )}
                        />
                    ) : (
                        <ul className="border-t border-[var(--popup-border)]">
                            {groups.map((group) => (
                                <li key={group.id}>
                                    <GroupRow
                                        name={group.name}
                                        detail={[
                                            membersLabel(
                                                activeIn('group', group.id),
                                            ),
                                            group.subgroups.length > 0 &&
                                                tc(
                                                    ':count subgroup|:count subgroups',
                                                    group.subgroups.length,
                                                ),
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                        onOpen={() =>
                                            setMembersOf({
                                                kind: 'group',
                                                id: group.id,
                                                title: group.name,
                                            })
                                        }
                                        onMenu={() =>
                                            setMenuFor({
                                                item: group,
                                                parent: null,
                                            })
                                        }
                                    />
                                    {group.subgroups.map((subgroup) => {
                                        const count = activeIn(
                                            'subgroup',
                                            subgroup.id,
                                        );

                                        return (
                                            <GroupRow
                                                key={subgroup.id}
                                                indented
                                                name={subgroup.name}
                                                detail={
                                                    count > 0
                                                        ? membersLabel(count)
                                                        : t('No members yet')
                                                }
                                                onOpen={() =>
                                                    setMembersOf({
                                                        kind: 'subgroup',
                                                        id: subgroup.id,
                                                        title: `${group.name} · ${subgroup.name}`,
                                                    })
                                                }
                                                onMenu={() =>
                                                    setMenuFor({
                                                        item: subgroup,
                                                        parent: group,
                                                    })
                                                }
                                            />
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openEditor('subgroup', { group })
                                        }
                                        className="relative flex w-full cursor-pointer items-center gap-2 border-b border-[var(--popup-border)] py-2.5 pr-[18px] pl-11 text-left text-sm font-bold text-hydra-blue hover:bg-[var(--popup-ghost)] dark:text-sky-300"
                                    >
                                        <span
                                            aria-hidden
                                            className="absolute top-0 left-7 h-1/2 border-l-2 border-[var(--popup-border)]"
                                        />
                                        <AddIcon sx={{ fontSize: 17 }} />
                                        {t('Add subgroup to :name', {
                                            name: group.name,
                                        })}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </DialogContent>
            </Dialog>

            {/* A group's or time slot's ⋮: members, rename, delete */}
            <ActionMenu
                open={!!menuFor}
                title={
                    menuFor?.parent
                        ? `${menuFor.parent.name} · ${menuFor.item.name}`
                        : (menuFor?.item.name ?? '')
                }
                subtitle={
                    menuFor
                        ? membersLabel(
                              activeIn(
                                  menuFor.parent ? 'subgroup' : 'group',
                                  menuFor.item.id,
                              ),
                          )
                        : undefined
                }
                onClose={() => setMenuFor(null)}
                actions={
                    menuFor
                        ? [
                              {
                                  label: menuFor.parent
                                      ? t('Members of the time slot')
                                      : t('Members of the group'),
                                  icon: <PeopleIcon fontSize="small" />,
                                  tone: 'primary',
                                  onClick: () =>
                                      setMembersOf({
                                          kind: menuFor.parent
                                              ? 'subgroup'
                                              : 'group',
                                          id: menuFor.item.id,
                                          title: menuFor.parent
                                              ? `${menuFor.parent.name} · ${menuFor.item.name}`
                                              : menuFor.item.name,
                                      }),
                              },
                              {
                                  label: t('Rename'),
                                  icon: <EditIcon fontSize="small" />,
                                  onClick: () =>
                                      openEditor('rename', {
                                          item: menuFor.item,
                                      }),
                              },
                              {
                                  label: menuFor.parent
                                      ? t('Delete subgroup')
                                      : t('Delete group'),
                                  icon: <DeleteIcon fontSize="small" />,
                                  tone: 'danger',
                                  onClick: () =>
                                      startDelete(menuFor.item, menuFor.parent),
                              },
                          ]
                        : []
                }
            />

            {/* New group, new time slot or a new name: one field */}
            <Dialog
                open={!!editor}
                onClose={() => !busy && setEditor(null)}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <PopupHeader
                    icon={
                        editor?.mode === 'rename' ? (
                            <EditIcon fontSize="small" />
                        ) : (
                            <AddIcon fontSize="small" />
                        )
                    }
                    title={editorTitle}
                    subtitle={
                        editor?.mode === 'subgroup'
                            ? editor.group?.name
                            : editor?.mode === 'rename'
                              ? editor.item?.name
                              : t('E.g. by age or level')
                    }
                    onClose={() => !busy && setEditor(null)}
                />
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        saveEditor();
                    }}
                >
                    <div className="flex flex-col gap-3 px-[18px] pt-2 pb-2">
                        <TextField
                            autoFocus
                            fullWidth
                            label={t('Name')}
                            placeholder={
                                editor?.mode === 'subgroup'
                                    ? t('E.g. 18:00')
                                    : undefined
                            }
                            value={editor?.value ?? ''}
                            onChange={(e) =>
                                editor &&
                                setEditor({ ...editor, value: e.target.value })
                            }
                            slotProps={{ htmlInput: { maxLength: 60 } }}
                            sx={FIELD_SX}
                        />
                        {error && <Note tone="error">{error}</Note>}
                    </div>
                    <PopupButtons>
                        <Button
                            variant="outlined"
                            disabled={busy}
                            onClick={() => setEditor(null)}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={
                                busy ||
                                !editor ||
                                editor.value.trim() === '' ||
                                editor.value.trim() === editor.item?.name
                            }
                        >
                            {t('Save')}
                        </Button>
                    </PopupButtons>
                </form>
            </Dialog>

            {/* Deleting a group or time slot: asked once, members moved first */}
            <ConfirmDialog
                open={!!deleting}
                icon={<DeleteIcon fontSize="small" />}
                title={
                    deleting?.parent ? t('Delete subgroup?') : t('Delete group?')
                }
                subtitle={
                    deleting?.parent
                        ? `${deleting.parent.name} · ${deleting.item.name}`
                        : deleting?.item.name
                }
                confirmLabel={t('Delete')}
                busy={busy}
                confirmDisabled={
                    needsMove && (destinations.length === 0 || moveTo === '')
                }
                onConfirm={confirmDelete}
                onClose={closeDelete}
            >
                {deleting && (
                    <>
                        {deletingSubgroups.length > 0 && (
                            <p>
                                {t(
                                    'Its subgroups (:names) will be deleted too.',
                                    {
                                        names: deletingSubgroups
                                            .map((s) => s.name)
                                            .join(', '),
                                    },
                                )}
                            </p>
                        )}
                        {needsMove &&
                            (destinations.length > 0 ? (
                                <FormControl
                                    fullWidth
                                    size="small"
                                    sx={{ mt: 1 }}
                                >
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
                                                    : Number(e.target.value),
                                            )
                                        }
                                    >
                                        {destinations.map((d) => (
                                            <MenuItem key={d.id} value={d.id}>
                                                {d.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <Note tone="warn">
                                    {t(
                                        'Add another group first, so its members have somewhere to go.',
                                    )}
                                </Note>
                            ))}
                        <p>
                            {t(
                                'Past trainings, payments and invoices keep its name.',
                            )}
                        </p>
                        {deleteError && <Note tone="error">{deleteError}</Note>}
                    </>
                )}
            </ConfirmDialog>

            <GroupMembersDialog
                of={membersOf}
                members={members}
                onClose={() => setMembersOf(null)}
            />
        </>
    );
}

/**
 * A group (or, indented under it, a time slot): its name and members. Tapping
 * it lists the members, ⋮ opens rename and delete.
 */
function GroupRow({
    name,
    detail,
    indented = false,
    onOpen,
    onMenu,
}: {
    name: string;
    detail: string;
    indented?: boolean;
    onOpen: () => void;
    onMenu: () => void;
}) {
    return (
        <div
            className={`relative flex items-center border-b border-[var(--popup-border)] ${indented ? 'pl-11' : 'pl-[18px]'}`}
        >
            {indented && (
                <span
                    aria-hidden
                    className="absolute inset-y-0 left-7 border-l-2 border-[var(--popup-border)]"
                />
            )}
            <button
                type="button"
                onClick={onOpen}
                className="min-w-0 flex-1 cursor-pointer py-3 text-left"
            >
                <span
                    className={`block truncate text-[var(--popup-fg)] ${indented ? 'text-sm font-semibold' : 'text-[15px] font-bold'}`}
                >
                    {name}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-[var(--popup-muted)]">
                    {detail}
                </span>
            </button>
            <button
                type="button"
                aria-label={t(':name, actions', { name })}
                onClick={onMenu}
                className="flex h-12 w-12 flex-none cursor-pointer items-center justify-center text-[var(--popup-muted)] hover:text-[var(--popup-fg)]"
            >
                <MoreVertIcon fontSize="small" />
            </button>
        </div>
    );
}
