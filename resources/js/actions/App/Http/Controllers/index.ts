import AdminController from './AdminController'
import MemberController from './MemberController'
import TrainingController from './TrainingController'
import AttendanceController from './AttendanceController'
import MembershipFeeController from './MembershipFeeController'
const Controllers = {
    AdminController: Object.assign(AdminController, AdminController),
MemberController: Object.assign(MemberController, MemberController),
TrainingController: Object.assign(TrainingController, TrainingController),
AttendanceController: Object.assign(AttendanceController, AttendanceController),
MembershipFeeController: Object.assign(MembershipFeeController, MembershipFeeController),
}

export default Controllers