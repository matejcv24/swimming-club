import { Head, router } from '@inertiajs/react';
import CloseIcon from '@mui/icons-material/Close';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { apiRequest } from '@/lib/api';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

interface UnpaidMember {
    id: number;
    name: string;
    pool: string;
    parentName: string | null;
    phone: string | null;
    latest_end_date: string | null;
}

interface Props {
    bigPoolMembers?: UnpaidMember[];
    smallPoolMembers?: UnpaidMember[];
}

interface ListUnpaidFeesResponse {
    bigPoolMembers: UnpaidMember[];
    smallPoolMembers: UnpaidMember[];
}

const darkTheme = createTheme({
    palette: { mode: 'dark' },
});

const DARK_BG = '#1d232a';

export default function UnpaidFeesIndex({
    bigPoolMembers: initialBigPoolMembers = [],
    smallPoolMembers: initialSmallPoolMembers = [],
}: Props) {
    const [tab, setTab] = useState(0);
    const [bigPoolMembers, setBigPoolMembers] = useState(initialBigPoolMembers);
    const [smallPoolMembers, setSmallPoolMembers] = useState(
        initialSmallPoolMembers,
    );
    const [loadingUnpaidFees, setLoadingUnpaidFees] = useState(false);
    const [unpaidFeesError, setUnpaidFeesError] = useState<string | null>(null);

    const members = tab === 0 ? bigPoolMembers : smallPoolMembers;

    useEffect(() => {
        const loadUnpaidFees = async () => {
            setLoadingUnpaidFees(true);
            setUnpaidFeesError(null);

            try {
                const data =
                    await apiRequest<ListUnpaidFeesResponse>(
                        '/api/unpaid-fees',
                    );

                setBigPoolMembers(data.bigPoolMembers);
                setSmallPoolMembers(data.smallPoolMembers);
            } catch {
                setUnpaidFeesError('Unable to refresh unpaid fees.');
            } finally {
                setLoadingUnpaidFees(false);
            }
        };

        void loadUnpaidFees();
    }, []);

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    return (
        <ThemeProvider theme={darkTheme}>
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
                        bgcolor: DARK_BG,
                    },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Unpaid Fees
                        </Typography>
                        <IconButton
                            onClick={() => router.visit('/dashboard')}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <Divider />
                    <Tabs
                        value={tab}
                        onChange={(_, newValue) => setTab(newValue)}
                        variant="fullWidth"
                        textColor="inherit"
                        indicatorColor="primary"
                    >
                        <Tab label={`Big Pool (${bigPoolMembers.length})`} />
                        <Tab
                            label={`Small Pool (${smallPoolMembers.length})`}
                        />
                    </Tabs>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    {unpaidFeesError && (
                        <Typography
                            variant="body2"
                            color="error"
                            sx={{ textAlign: 'center', mt: 2 }}
                        >
                            {unpaidFeesError}
                        </Typography>
                    )}

                    {loadingUnpaidFees ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 6 }}
                        >
                            Loading unpaid fees...
                        </Typography>
                    ) : members.length === 0 ? (
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
                                                    Phone: {member.phone ?? '-'}
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
        </ThemeProvider>
    );
}
