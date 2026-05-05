import MemberController from './MemberController';
import MembershipFeeController from './MembershipFeeController';
const Api = {
    MemberController: Object.assign(MemberController, MemberController),
    MembershipFeeController: Object.assign(
        MembershipFeeController,
        MembershipFeeController,
    ),
};

export default Api;
