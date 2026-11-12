import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import GroupsIcon from '@mui/icons-material/Groups';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaymentsIcon from '@mui/icons-material/Payments';

/** One icon per kind of notification, matching the dashboard cards. */
export function NotificationIcon({ type }: { type: string }) {
    switch (type) {
        case 'member_changed':
            return <GroupsIcon fontSize="small" />;
        case 'membership_payment':
            return <CreditCardIcon fontSize="small" />;
        case 'salary_added':
            return <PaymentsIcon fontSize="small" />;
        case 'training_attendance':
            return <AssignmentTurnedInIcon fontSize="small" />;
        default:
            return <NotificationsIcon fontSize="small" />;
    }
}
