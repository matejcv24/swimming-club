import NotificationController from './NotificationController';
import StaffController from './StaffController';
import AttendanceController from './AttendanceController';
import MemberController from './MemberController';
import MembershipFeeController from './MembershipFeeController';
import TrainingController from './TrainingController';
import UnpaidFeeController from './UnpaidFeeController';
const Api = {
    NotificationController: Object.assign(
        NotificationController,
        NotificationController,
    ),
    StaffController: Object.assign(StaffController, StaffController),
    AttendanceController: Object.assign(
        AttendanceController,
        AttendanceController,
    ),
    MemberController: Object.assign(MemberController, MemberController),
    MembershipFeeController: Object.assign(
        MembershipFeeController,
        MembershipFeeController,
    ),
    TrainingController: Object.assign(TrainingController, TrainingController),
    UnpaidFeeController: Object.assign(
        UnpaidFeeController,
        UnpaidFeeController,
    ),
};

export default Api;
