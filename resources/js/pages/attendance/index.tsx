import { Head } from '@inertiajs/react';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useEffect, useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import { MemberAttendanceDialog } from '@/components/member-attendance-dialog';
import {
    MuiThemeProvider,
    POPUP_BG,
    POPUP_FG,
    popupFg,
} from '@/components/mui-theme-provider';
import {
    avatarSx,
    EmptyState,
    PillSearchField,
    PopupHeader,
} from '@/components/popup-ui';
import { usePagePopup } from '@/hooks/use-page-popup';
import { groupNameOf, useGroups } from '@/lib/groups';
import { t, tc } from '@/lib/i18n';

interface Member {
    id: number;
    name: string;
    group_id: number | null;
    current_month_attendances_count: number;
}

interface Props {
    userRole: 'admin' | 'coach';
    members: Member[];
}

export default function AttendanceIndex({ members }: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    const groups = useGroups();
    // 'all' or one group's id. The groups are only the ones this user may see, so
    // "All" means every group for admins and all of a coach's own groups. A coach
    // with a single group just sees that group (no "All").
    const showAll = groups.length !== 1;
    const [groupFilter, setGroupFilter] = useState<'all' | number>('all');
    const activeFilter: 'all' | number =
        groupFilter !== 'all' && groups.some((g) => g.id === groupFilter)
            ? groupFilter
            : showAll
              ? 'all'
              : groups[0].id;
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [attendanceSearch, setAttendanceSearch] = useState('');

    const counts = members.reduce<Record<number, number>>((all, member) => {
        if (member.group_id !== null) {
            all[member.group_id] = (all[member.group_id] ?? 0) + 1;
        }

        return all;
    }, {});

    const filteredMembers = members.filter(
        (member) =>
            (activeFilter === 'all' ||
                member.group_id === activeFilter ||
                member.group_id === null) &&
            member.name.toLowerCase().includes(attendanceSearch.toLowerCase()),
    );

    const openHistory = (member: Member) => setSelectedMember(member);

    // From a member's card: their attendance right away
    useEffect(() => {
        const memberId = Number(
            new URLSearchParams(window.location.search).get('member'),
        );
        const member = members.find((item) => item.id === memberId);

        if (member) {
            queueMicrotask(() => void openHistory(member));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title={t('Attendance')} />

            <Dialog
                {...popup.dialogProps}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: POPUP_BG,
                        height: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<AssignmentTurnedInIcon fontSize="small" />}
                        title={t('Attendance')}
                        subtitle={`${activeFilter === 'all' ? t('All groups') : groupNameOf(groups, activeFilter)} · ${tc(':count member|:count members', filteredMembers.length)}`}
                        onClose={popup.close}
                    />
                    {groups.length > 0 && (
                        <div className="px-[18px] pt-4 pb-3">
                            <FormControl fullWidth size="small">
                                <InputLabel
                                    id="attendance-group-label"
                                    sx={{ color: popupFg(0.5) }}
                                >
                                    {t('Group')}
                                </InputLabel>
                                <Select
                                    labelId="attendance-group-label"
                                    label={t('Group')}
                                    value={activeFilter}
                                    onChange={(e) =>
                                        setGroupFilter(
                                            e.target.value === 'all'
                                                ? 'all'
                                                : Number(e.target.value),
                                        )
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
                                    {showAll && (
                                        <MenuItem value="all">
                                            {t('All (:count)', {
                                                count: members.length,
                                            })}
                                        </MenuItem>
                                    )}
                                    {groups.map((group) => (
                                        <MenuItem
                                            key={group.id}
                                            value={group.id}
                                        >
                                            {group.name} (
                                            {counts[group.id] ?? 0})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                    )}
                    <PillSearchField
                        value={attendanceSearch}
                        onChange={setAttendanceSearch}
                        placeholder={t('Search member...')}
                    />
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    {filteredMembers.length === 0 ? (
                        <EmptyState
                            icon={<AssignmentTurnedInIcon />}
                            title={t('No members found.')}
                        />
                    ) : (
                        <ul className="border-t border-[var(--popup-border)]">
                            {filteredMembers.map((member, index) => (
                                <li
                                    key={member.id}
                                    className="border-b border-[var(--popup-border)]"
                                >
                                    <button
                                        type="button"
                                        onClick={() => void openHistory(member)}
                                        className="flex w-full cursor-pointer items-center gap-3 px-[18px] py-2.5 text-left transition hover:bg-[var(--popup-ghost)]"
                                    >
                                        <Avatar sx={avatarSx(index)}>
                                            {getInitials(member.name)}
                                        </Avatar>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[15px] font-bold text-[var(--popup-fg)]">
                                                {member.name}
                                            </span>
                                            <span className="block text-[13px] text-[var(--popup-muted)]">
                                                {activeFilter === 'all' &&
                                                    `${groupNameOf(groups, member.group_id)} · `}
                                                {t('Attendances: :count', {
                                                    count: member.current_month_attendances_count,
                                                })}
                                            </span>
                                        </span>
                                        <ChevronRightIcon
                                            fontSize="small"
                                            className="flex-none text-[var(--popup-muted)]"
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </DialogContent>
            </Dialog>

            <MemberAttendanceDialog
                member={selectedMember}
                onClose={() => setSelectedMember(null)}
            />
        </MuiThemeProvider>
    );
}
