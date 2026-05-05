import members from './members';
import membershipFees from './membership-fees';
const api = {
    members: Object.assign(members, members),
    membershipFees: Object.assign(membershipFees, membershipFees),
};

export default api;
