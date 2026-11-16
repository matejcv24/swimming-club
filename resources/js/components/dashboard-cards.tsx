import { Link, router } from '@inertiajs/react';
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
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import type { ReactNode } from 'react';
import { IconBadge } from '@/components/popup-ui';
import { useGroups } from '@/lib/groups';
import { t, tc } from '@/lib/i18n';

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

// Sections open inside the app (no full page reload) and start loading as soon as the
// pointer is over a card. Loaded pages are kept only briefly so numbers are never stale.
const PREFETCH_FOR = '5s';
const prefetchOnHover = (href: string) => () =>
    router.prefetch(href, { method: 'get' }, { cacheFor: PREFETCH_FOR });

const card =
    'rounded-2xl border border-border bg-card text-left shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg cursor-pointer';

// Icons and badges grow on computer screens, where the cards fill the screen
const iconSx = { fontSize: { xs: 20, md: 28 } };
const badgeSize = 'size-[38px] md:size-12';

function StatCard({
    icon,
    tone,
    label,
    period,
    onClick,
    onHover,
    wide = false,
    periodBelow = false,
    children,
}: {
    icon: ReactNode;
    tone?: 'brand' | 'red' | 'green';
    label: string;
    period: string;
    onClick?: () => void;
    /** Start loading the page the card opens. */
    onHover?: () => void;
    /** Spans both columns on computers. */
    wide?: boolean;
    /** Phones: the period on its own line under the label, not "(period)" beside it. */
    periodBelow?: boolean;
    children: ReactNode;
}) {
    // Phones: icon on the left; "Label (period)" and the value centred in the card.
    // Computers: icon, label and period on the left like the other cards; the value on
    // the right, or centred in the wide Profit card (three columns, the outer two equal).
    return (
        <button
            onClick={onClick}
            onMouseEnter={onHover}
            onFocus={onHover}
            className={`${card} relative grid min-h-0 items-center justify-items-center gap-2 px-16 py-5 text-center md:justify-items-stretch md:gap-6 md:px-7 md:py-2 md:text-left ${wide ? 'md:col-span-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]' : 'md:grid-cols-[minmax(0,1fr)_auto]'}`}
        >
            <div className="contents md:flex md:min-w-0 md:items-center md:gap-4">
                <IconBadge
                    tone={tone}
                    className={`${badgeSize} absolute top-1/2 left-5 -translate-y-1/2 md:static md:translate-y-0`}
                >
                    {icon}
                </IconBadge>
                <div className="min-w-0 text-center md:text-left">
                    {/* Same title and description sizes as the other cards */}
                    <h2 className="text-[15px] font-bold md:text-xl">
                        {label}
                        {!periodBelow && (
                            <span className="text-[12.5px] font-normal text-muted-foreground md:hidden">
                                {' '}
                                ({period})
                            </span>
                        )}
                    </h2>
                    <p
                        className={`truncate text-[12.5px] text-muted-foreground md:block md:text-sm ${periodBelow ? '' : 'hidden'}`}
                    >
                        {period}
                    </p>
                </div>
            </div>
            <div>{children}</div>
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
            className={`text-[28px] font-extrabold tracking-tight md:text-[2.75rem] md:leading-none ${className}`}
        >
            {value}
            {unit && (
                <span className="ml-1.5 text-[13px] font-semibold tracking-normal text-muted-foreground md:text-lg">
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
    wide = false,
    className = '',
}: {
    href: string;
    icon: ReactNode;
    title: string;
    description: string;
    /** Spans both columns (the last card when the count is odd). */
    wide?: boolean;
    className?: string;
}) {
    return (
        <Link
            href={href}
            prefetch
            cacheFor={PREFETCH_FOR}
            preserveScroll
            className={`${card} flex min-h-0 items-center gap-3 p-5 md:gap-5 md:px-7 md:py-2 ${wide ? 'md:col-span-2' : ''} ${className}`}
        >
            <IconBadge className={badgeSize}>{icon}</IconBadge>
            <div className="min-w-0">
                <h2 className="text-[15px] font-bold md:text-xl">{title}</h2>
                <p className="truncate text-[12.5px] text-muted-foreground md:text-sm">
                    {description}
                </p>
            </div>
            <ChevronRightIcon className="ml-auto text-muted-foreground" />
        </Link>
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
    const period = t(':year so far', { year: new Date().getFullYear() });
    const isAdmin = userRole === 'admin';
    const groups = useGroups();
    const subgroupCount = groups.reduce(
        (sum, group) => sum + group.subgroups.length,
        0,
    );
    const groupsDescription =
        groups.length === 0
            ? t('Create your first group')
            : [
                  tc(':count group|:count groups', groups.length),
                  subgroupCount > 0 &&
                      tc(':count subgroup|:count subgroups', subgroupCount),
              ]
                  .filter(Boolean)
                  .join(' · ');
    const profitDown = profitTotal < 0;

    return (
        // Phones: one column. Computers: two columns filling exactly the screen below
        // the header (4rem plus the 1rem gap below it), rows sharing the height, so the
        // dashboard never scrolls.
        <div className="grid flex-1 gap-4 p-4 md:h-[calc(100svh-5rem)] md:flex-none md:auto-rows-[minmax(0,1fr)] md:grid-cols-2 md:gap-3 md:px-6 md:pt-0 md:pb-4">
            {isAdmin && (
                <StatCard
                    icon={
                        profitDown ? (
                            <TrendingDownIcon sx={iconSx} />
                        ) : (
                            <TrendingUpIcon sx={iconSx} />
                        )
                    }
                    tone={profitDown ? 'red' : 'green'}
                    label={t('Profit')}
                    period={period}
                    onClick={() =>
                        router.visit('/profit', { preserveScroll: true })
                    }
                    onHover={prefetchOnHover('/profit')}
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
                    icon={<ReceiptLongIcon sx={iconSx} />}
                    label={t('Invoices')}
                    period={period}
                    onClick={() =>
                        router.visit('/invoices', { preserveScroll: true })
                    }
                    onHover={prefetchOnHover('/invoices')}
                >
                    <Amount value={formatCurrency(invoiceTotal)} unit="MKD" />
                </StatCard>
            )}

            {isAdmin && (
                <StatCard
                    icon={<DescriptionIcon sx={iconSx} />}
                    label={t('Monthly report')}
                    periodBelow
                    period={t('Fees, invoices, salaries')}
                    onClick={onOpenReport}
                >
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-hydra-blue px-3.5 py-2 text-[13px] font-bold text-white md:px-5 md:py-2.5 md:text-base">
                        <DownloadIcon sx={{ fontSize: { xs: 16, md: 20 } }} />
                        {t('Download PDF')}
                    </span>
                </StatCard>
            )}

            {userRole === 'coach' && (
                <StatCard
                    icon={<PaymentsIcon sx={iconSx} />}
                    label={t('Salary')}
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
                icon={<WarningIcon sx={iconSx} />}
                tone={unpaidFees > 0 ? 'red' : 'green'}
                label={t('Unpaid fees')}
                periodBelow
                period={t('Members late with payment')}
                onClick={() =>
                    router.visit('/unpaid-fees', { preserveScroll: true })
                }
                onHover={prefetchOnHover('/unpaid-fees')}
            >
                <Amount
                    value={unpaidFees}
                    className={
                        unpaidFees > 0 ? 'text-red-500' : 'text-green-500'
                    }
                />
            </StatCard>

            {/* Right after Unpaid fees (phones: below it; computers: next to Members) */}
            {isAdmin && (
                <NavCard
                    href="/groups"
                    icon={<WorkspacesIcon sx={iconSx} />}
                    title={t('Groups')}
                    description={groupsDescription}
                />
            )}

            <NavCard
                href="/members"
                icon={<GroupsIcon sx={iconSx} />}
                title={t('Members')}
                description={tc(
                    ':count active member|:count active members',
                    activeMembers,
                )}
            />
            <NavCard
                href="/trainings"
                icon={<CalendarMonthIcon sx={iconSx} />}
                title={t('Trainings')}
                description={t('Attendance by day')}
            />
            <NavCard
                href="/membership-fees"
                icon={<CreditCardIcon sx={iconSx} />}
                title={t('Membership Fees')}
                description={t('Record and review payments')}
            />
            <NavCard
                href="/attendance"
                icon={<AssignmentTurnedInIcon sx={iconSx} />}
                title={t('Attendance')}
                description={t('Per member and group')}
            />
            {isAdmin && (
                <NavCard
                    href="/staff"
                    icon={<PersonIcon sx={iconSx} />}
                    title={t('Staff')}
                    description={t('Coaches and salaries')}
                />
            )}
        </div>
    );
}
