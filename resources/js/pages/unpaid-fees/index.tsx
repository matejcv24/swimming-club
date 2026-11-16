import { Head } from '@inertiajs/react';
import WarningIcon from '@mui/icons-material/Warning';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import {
    MuiThemeProvider,
    POPUP_BG,
    POPUP_FG,
    popupFg,
} from '@/components/mui-theme-provider';
import { PopupHeader } from '@/components/popup-ui';
import { usePagePopup } from '@/hooks/use-page-popup';
import { useGroups } from '@/lib/groups';

interface UnpaidMember {
    id: number;
    name: string;
    group_id: number | null;
    parentName: string | null;
    phone: string | null;
    latest_end_date: string | null;
}

interface Props {
    unpaidMembers: UnpaidMember[];
}

export default function UnpaidFeesIndex({ unpaidMembers }: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    const groups = useGroups();
    // 'all' or one group's id
    const [groupFilter, setGroupFilter] = useState<'all' | number>('all');
    const activeFilter =
        groupFilter !== 'all' && groups.some((g) => g.id === groupFilter)
            ? groupFilter
            : 'all';

    // How many unpaid members each group has, shown in the drop-down
    const counts = unpaidMembers.reduce<Record<number, number>>(
        (all, member) => {
            if (member.group_id !== null) {
                all[member.group_id] = (all[member.group_id] ?? 0) + 1;
            }

            return all;
        },
        {},
    );

    const members =
        activeFilter === 'all'
            ? unpaidMembers
            : unpaidMembers.filter(
                  (member) => member.group_id === activeFilter,
              );

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
            <Head title="Unpaid Fees" />

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
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<WarningIcon fontSize="small" />}
                        title="Unpaid Fees"
                        subtitle={`${unpaidMembers.length} members to follow up`}
                        onClose={popup.close}
                    />
                    <div className="px-[18px] pb-3">
                        <FormControl fullWidth size="small">
                            <InputLabel
                                id="unpaid-group-label"
                                sx={{ color: popupFg(0.5) }}
                            >
                                Group
                            </InputLabel>
                            <Select
                                labelId="unpaid-group-label"
                                label="Group"
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
                                    '& .MuiSvgIcon-root': { color: POPUP_FG },
                                }}
                            >
                                <MenuItem value="all">
                                    All ({unpaidMembers.length})
                                </MenuItem>
                                {groups.map((group) => (
                                    <MenuItem key={group.id} value={group.id}>
                                        {group.name} ({counts[group.id] ?? 0})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    {members.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 6 }}
                        >
                            {activeFilter === 'all'
                                ? 'No overdue members.'
                                : 'No overdue members in this group.'}
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {members.map((member) => (
                                <ListItem key={member.id} divider>
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
                                            <>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ display: 'block' }}
                                                >
                                                    Parent:{' '}
                                                    {member.parentName ?? '-'}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ display: 'block' }}
                                                >
                                                    Phone:{' '}
                                                    {member.phone ? (
                                                        <Link
                                                            href={`tel:${member.phone.replace(/[^\d+]/g, '')}`}
                                                            underline="none"
                                                        >
                                                            {member.phone}
                                                        </Link>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="error"
                                                    sx={{ display: 'block' }}
                                                >
                                                    Expired:{' '}
                                                    {member.latest_end_date
                                                        ? dayjs(
                                                              member.latest_end_date,
                                                          ).format('DD.MM.YYYY')
                                                        : 'No recorded fee'}
                                                </Typography>
                                            </>
                                        }
                                        secondaryTypographyProps={{
                                            component: 'div',
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
}
