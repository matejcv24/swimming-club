import members from './members';
import membershipFees from './membership-fees';
import trainings from './trainings';
const api = {
    members: Object.assign(members, members),
    membershipFees: Object.assign(membershipFees, membershipFees),
    trainings: Object.assign(trainings, trainings),
};

export default api;
