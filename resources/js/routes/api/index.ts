import members from './members';
import membershipFees from './membership-fees';
import trainings from './trainings';
import unpaidFees from './unpaid-fees';
const api = {
    members: Object.assign(members, members),
    membershipFees: Object.assign(membershipFees, membershipFees),
    trainings: Object.assign(trainings, trainings),
    unpaidFees: Object.assign(unpaidFees, unpaidFees),
};

export default api;
