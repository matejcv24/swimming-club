import { Head, router } from '@inertiajs/react';
import WarningIcon from '@mui/icons-material/Warning';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import { MuiThemeProvider, POPUP_BG } from '@/components/mui-theme-provider';
import { PopupHeader } from '@/components/popup-ui';

interface UnpaidMember {
    id: number;
    name: string;
    pool: string;
    parentName: string | null;
    phone: string | null;
    latest_end_date: string | null;
}

interface Props {
    bigPoolMembers: UnpaidMember[];
    smallPoolMembers: UnpaidMember[];
}

export default function UnpaidFeesIndex({
    bigPoolMembers,
    smallPoolMembers,
}: Props) {
    const [tab, setTab] = useState(1);

    const members = tab === 0 ? bigPoolMembers : smallPoolMembers;

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
                open={true}
                onClose={() => router.visit('/dashboard')}
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
                        subtitle={`${bigPoolMembers.length + smallPoolMembers.length} members to follow up`}
                        onClose={() => router.visit('/dashboard')}
                    />
                    <Tabs
                        value={tab}
                        onChange={(_, newValue) => setTab(newValue)}
                        variant="fullWidth"
                        textColor="inherit"
                        indicatorColor="primary"
                    >
                        <Tab label={`Big pool (${bigPoolMembers.length})`} />
                        <Tab
                            label={`Small pool (${smallPoolMembers.length})`}
                        />
                    </Tabs>
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    {members.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 6 }}
                        >
                            No overdue members in this pool.
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
