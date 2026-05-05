import notifications from './notifications';
import staff from './staff';
import salaries from './salaries';
import invoices from './invoices';
import attendance from './attendance';
import members from './members';
import membershipFees from './membership-fees';
import trainings from './trainings';
import unpaidFees from './unpaid-fees';
const api = {
    notifications: Object.assign(notifications, notifications),
    staff: Object.assign(staff, staff),
    salaries: Object.assign(salaries, salaries),
    invoices: Object.assign(invoices, invoices),
    attendance: Object.assign(attendance, attendance),
    members: Object.assign(members, members),
    membershipFees: Object.assign(membershipFees, membershipFees),
    trainings: Object.assign(trainings, trainings),
    unpaidFees: Object.assign(unpaidFees, unpaidFees),
};

export default api;
