import MemberController from './MemberController';
import MembershipFeeController from './MembershipFeeController';
import TrainingController from './TrainingController';
const Api = {
    MemberController: Object.assign(MemberController, MemberController),
    MembershipFeeController: Object.assign(
        MembershipFeeController,
        MembershipFeeController,
    ),
    TrainingController: Object.assign(TrainingController, TrainingController),
};

export default Api;
