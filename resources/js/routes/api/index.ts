import dashboard from './dashboard';
import notifications from './notifications';
import profile from './profile';
import security from './security';
import userPassword from './user-password';
import staff from './staff';
import salaries from './salaries';
import invoices from './invoices';
import profit from './profit';
import attendance from './attendance';
import members from './members';
import membershipFees from './membership-fees';
import trainings from './trainings';
import unpaidFees from './unpaid-fees';
const api = {
    dashboard: Object.assign(dashboard, dashboard),
    notifications: Object.assign(notifications, notifications),
    profile: Object.assign(profile, profile),
    security: Object.assign(security, security),
    userPassword: Object.assign(userPassword, userPassword),
    staff: Object.assign(staff, staff),
    salaries: Object.assign(salaries, salaries),
    invoices: Object.assign(invoices, invoices),
    profit: Object.assign(profit, profit),
    attendance: Object.assign(attendance, attendance),
    members: Object.assign(members, members),
    membershipFees: Object.assign(membershipFees, membershipFees),
    trainings: Object.assign(trainings, trainings),
    unpaidFees: Object.assign(unpaidFees, unpaidFees),
};

export default api;
