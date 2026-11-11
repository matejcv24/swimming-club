import { router } from '@inertiajs/react';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import GroupsIcon from '@mui/icons-material/Groups';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import type { ReactNode } from 'react';
import { IconBadge } from '@/components/popup-ui';

export type DashboardSummary = {
    userRole: 'admin' | 'coach';
    activeMembers: number;
    unpaidFees: number;
    invoiceTotal: number;
    profitTotal: number;
    coachSalaryTotal: number;
};

type Props = DashboardSummary & {
    onOpenSalary?: () => void;
    onOpenReport?: () => void;
};

const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);

const card =
    'rounded-2xl border border-border bg-card text-left shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg cursor-pointer';

function StatCard({
    icon,
    tone,
    label,
    period,
    onClick,
    children,
}: {
    icon: ReactNode;
    tone?: 'brand' | 'red' | 'green';
    label: string;
    period: string;
    onClick?: () => void;
    children: ReactNode;
}) {
    return (
        <button onClick={onClick} className={`${card} p-4`}>
            <div className="flex items-center gap-2.5">
                <IconBadge tone={tone}>{icon}</IconBadge>
                <div>
                    <p className="text-[13px] font-semibold text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-xs text-muted-foreground">{period}</p>
                </div>
            </div>
            {children}
        </button>
    );
}

function Amount({
    value,
    unit,
    className = '',
}: {
    value: string | number;
    unit?: string;
    className?: string;
}) {
    return (
        <p
            className={`mt-3 text-[28px] font-extrabold tracking-tight ${className}`}
        >
            {value}
            {unit && (
                <span className="ml-1 text-[13px] font-semibold tracking-normal text-muted-foreground">
                    {unit}
                </span>
            )}
        </p>
    );
}

function NavCard({
    href,
    icon,
    title,
    description,
}: {
    href: string;
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <a href={href} className={`${card} flex items-center gap-3 p-4`}>
            <IconBadge>{icon}</IconBadge>
            <div className="min-w-0">
                <h2 className="text-[15px] font-bold">{title}</h2>
                <p className="truncate text-[12.5px] text-muted-foreground">
                    {description}
                </p>
            </div>
            <ChevronRightIcon className="ml-auto text-muted-foreground" />
        </a>
    );
}

/** The dashboard's cards. Also drawn behind the pop-up pages. */
export function DashboardCards({
    userRole,
    activeMembers,
    unpaidFees,
    invoiceTotal,
    profitTotal,
    coachSalaryTotal,
    onOpenSalary,
    onOpenReport,
}: Props) {
    const period = `${new Date().getFullYear()} so far`;
    const isAdmin = userRole === 'admin';
    const profitDown = profitTotal < 0;

    return (
        <div className="flex h-full flex-1 flex-col gap-4 p-6">
            <div
                className={`grid gap-3.5 ${isAdmin ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2'}`}
            >
                {isAdmin && (
                    <StatCard
                        icon={
                            profitDown ? (
                                <TrendingDownIcon fontSize="small" />
                            ) : (
                                <TrendingUpIcon fontSize="small" />
                            )
                        }
                        tone={profitDown ? 'red' : 'green'}
                        label="Profit"
                        period={period}
                        onClick={() => router.visit('/profit')}
                    >
                        <Amount
                            value={formatCurrency(profitTotal)}
                            unit="MKD"
                            className={
                                profitDown ? 'text-red-500' : 'text-green-500'
                            }
                        />
                    </StatCard>
                )}

                {isAdmin && (
                    <StatCard
                        icon={<ReceiptLongIcon fontSize="small" />}
                        label="Invoices"
                        period={period}
                        onClick={() => router.visit('/invoices')}
                    >
                        <Amount
                            value={formatCurrency(invoiceTotal)}
                            unit="MKD"
                        />
                    </StatCard>
                )}

                {isAdmin && (
                    <StatCard
                        icon={<DescriptionIcon fontSize="small" />}
                        label="Monthly report"
                        period="Fees, invoices, salaries"
                        onClick={onOpenReport}
                    >
                        <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-hydra-blue px-3.5 py-2 text-[13px] font-bold text-white">
                            <DownloadIcon sx={{ fontSize: 16 }} />
                            Download PDF
                        </span>
                    </StatCard>
                )}

                {userRole === 'coach' && (
                    <StatCard
                        icon={<PaymentsIcon fontSize="small" />}
                        label="Salary"
                        period={period}
                        onClick={onOpenSalary}
                    >
                        <Amount
                            value={formatCurrency(coachSalaryTotal)}
                            unit="MKD"
                        />
                    </StatCard>
                )}

                <StatCard
                    icon={<WarningIcon fontSize="small" />}
                    tone={unpaidFees > 0 ? 'red' : 'green'}
                    label="Unpaid fees"
                    period="Members to follow up"
                    onClick={() => router.visit('/unpaid-fees')}
                >
                    <Amount
                        value={unpaidFees}
                        className={
                            unpaidFees > 0 ? 'text-red-500' : 'text-green-500'
                        }
                    />
                </StatCard>
            </div>

            <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                <NavCard
                    href="/members"
                    icon={<GroupsIcon fontSize="small" />}
                    title="Members"
                    description={`${activeMembers} active ${activeMembers === 1 ? 'member' : 'members'}`}
                />
                <NavCard
                    href="/trainings"
                    icon={<CalendarMonthIcon fontSize="small" />}
                    title="Trainings"
                    description="Calendar by pool"
                />
                <NavCard
                    href="/membership-fees"
                    icon={<CreditCardIcon fontSize="small" />}
                    title="Membership Fees"
                    description="Record and review payments"
                />
                <NavCard
                    href="/attendance"
                    icon={<AssignmentTurnedInIcon fontSize="small" />}
                    title="Attendance"
                    description="Per member and pool"
                />
                {isAdmin && (
                    <NavCard
                        href="/staff"
                        icon={<PersonIcon fontSize="small" />}
                        title="Staff"
                        description="Coaches and salaries"
                    />
                )}
            </div>
        </div>
    );
}
