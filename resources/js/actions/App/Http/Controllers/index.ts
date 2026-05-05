import Api from './Api';
import StaffController from './StaffController';
import AdminController from './AdminController';
import NotificationController from './NotificationController';
import MemberController from './MemberController';
import ClubParentController from './ClubParentController';
import AttendanceController from './AttendanceController';
import TrainingController from './TrainingController';
import MembershipFeeController from './MembershipFeeController';
import UnpaidFeeController from './UnpaidFeeController';
import ProfitController from './ProfitController';
import Settings from './Settings';
const Controllers = {
    Api: Object.assign(Api, Api),
    StaffController: Object.assign(StaffController, StaffController),
    AdminController: Object.assign(AdminController, AdminController),
    NotificationController: Object.assign(
        NotificationController,
        NotificationController,
    ),
    MemberController: Object.assign(MemberController, MemberController),
    ClubParentController: Object.assign(
        ClubParentController,
        ClubParentController,
    ),
    AttendanceController: Object.assign(
        AttendanceController,
        AttendanceController,
    ),
    TrainingController: Object.assign(TrainingController, TrainingController),
    MembershipFeeController: Object.assign(
        MembershipFeeController,
        MembershipFeeController,
    ),
    UnpaidFeeController: Object.assign(
        UnpaidFeeController,
        UnpaidFeeController,
    ),
    ProfitController: Object.assign(ProfitController, ProfitController),
    Settings: Object.assign(Settings, Settings),
};

export default Controllers;
