import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GroupsIcon from '@mui/icons-material/Groups';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { MemberDetailsDialog } from '@/components/member-details-dialog';
import type { MemberDetails } from '@/components/member-details-dialog';
import { POPUP_BG } from '@/components/mui-theme-provider';
import { avatarSx, PopupHeader } from '@/components/popup-ui';
import { subgroupsOf, useGroups } from '@/lib/groups';
import { t, tc } from '@/lib/i18n';

/** Which members to list: everyone in a main group, or in one of its subgroups. */
export type MembersOf =
    | { kind: 'group'; id: number; title: string }
    | { kind: 'subgroup'; id: number; title: string };

const getInitials = (name: string) =>
    name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

/**
 * "12 members ›" in the club blue, underlined on hover, so it reads as a link.
 * With no members it is plain text (nothing to open).
 */
export function MembersLink({
    count,
    onClick,
}: {
    count: number;
    onClick: () => void;
}) {
    const label = tc(':count member|:count members', count);

    if (count === 0) {
        return <span>{t('No members yet')}</span>;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="-mx-1 inline-flex cursor-pointer items-center gap-0.5 rounded px-1 font-semibold text-hydra-blue underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-hydra-blue focus-visible:outline-none"
        >
            {label}
            <ChevronRightIcon sx={{ fontSize: 16 }} />
        </button>
    );
}

/** The active members of a group or subgroup; tapping one opens their details. */
export function GroupMembersDialog({
    of,
    members,
    onClose,
}: {
    of: MembersOf | null;
    members: MemberDetails[];
    onClose: () => void;
}) {
    const groups = useGroups();
    const [details, setDetails] = useState<MemberDetails | null>(null);

    const listed = of
        ? members
              .filter((member) =>
                  of.kind === 'group'
                      ? member.group_id === of.id || member.group_id === null
                      : member.subgroup_id === of.id,
              )
              .sort((a, b) => a.name.localeCompare(b.name))
        : [];

    // In a main group's list, say which subgroup each member is in
    const subgroupName = (member: MemberDetails) =>
        of?.kind === 'group' && member.subgroup_id !== null
            ? subgroupsOf(groups, member.group_id).find(
                  (subgroup) => subgroup.id === member.subgroup_id,
              )?.name
            : undefined;

    return (
        <>
            <Dialog
                open={!!of}
                onClose={onClose}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: POPUP_BG,
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<GroupsIcon fontSize="small" />}
                        title={of?.title ?? ''}
                        subtitle={tc(
                            ':count member|:count members',
                            listed.length,
                        )}
                        onClose={onClose}
                    />
                    <p className="flex items-center gap-1.5 px-[18px] pb-2 text-[12.5px] font-normal text-[var(--popup-muted)]">
                        <TouchAppIcon sx={{ fontSize: 16 }} />
                        {t('Tap a member to see their details')}
                    </p>
                </DialogTitle>
                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    <List disablePadding>
                        {listed.map((member, index) => (
                            <ListItemButton
                                key={member.id}
                                divider
                                onClick={() => setDetails(member)}
                                sx={{ px: 2.25 }}
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
                                        subgroupName(member) && (
                                            <span className="text-xs text-[var(--popup-muted)]">
                                                {subgroupName(member)}
                                            </span>
                                        )
                                    }
                                />
                                <ChevronRightIcon
                                    sx={{ color: 'var(--popup-muted)' }}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>

            <MemberDetailsDialog
                member={details}
                onClose={() => setDetails(null)}
            />
        </>
    );
}
