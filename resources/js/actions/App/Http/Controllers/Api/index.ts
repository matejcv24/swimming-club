import DashboardController from './DashboardController';
import NotificationController from './NotificationController';
import StaffController from './StaffController';
import SalaryController from './SalaryController';
import InvoiceController from './InvoiceController';
import ProfitController from './ProfitController';
import AttendanceController from './AttendanceController';
import MemberController from './MemberController';
import MembershipFeeController from './MembershipFeeController';
import TrainingController from './TrainingController';
import UnpaidFeeController from './UnpaidFeeController';
const Api = {
    DashboardController: Object.assign(
        DashboardController,
        DashboardController,
    ),
    NotificationController: Object.assign(
        NotificationController,
        NotificationController,
    ),
    StaffController: Object.assign(StaffController, StaffController),
    SalaryController: Object.assign(SalaryController, SalaryController),
    InvoiceController: Object.assign(InvoiceController, InvoiceController),
    ProfitController: Object.assign(ProfitController, ProfitController),
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
