import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { MemberAttendanceDialog } from '@/components/member-attendance-dialog';
import { POPUP_BG } from '@/components/mui-theme-provider';
import { MemberPaymentsDialog } from '@/components/payment-history';
import { GroupChip, PopupHeader, StatusDot } from '@/components/popup-ui';
import { groupWithSubgroupName, useGroups } from '@/lib/groups';
import { t } from '@/lib/i18n';

/** What the Member Details pop-up shows about a member. */
export interface MemberDetails {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    status: 'active' | 'inactive';
    group_id: number | null;
    subgroup_id: number | null;
    parent?: {
        name: string;
        phone: string;
        email?: string | null;
    } | null;
}

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

/**
 * A member's card: the avatar with the group and status in the header, the
 * details in two columns, and the actions as rows (payment history and
 * attendance blue, edit, delete red and last).
 */
export function MemberDetailsDialog<T extends MemberDetails>({
    member,
    onClose,
    onEdit,
    onDelete,
}: {
    member: T | null;
    onClose: () => void;
    /** Without it (e.g. from Trainings), the card has no Edit row. */
    onEdit?: (member: T) => void;
    onDelete?: (member: T) => void;
}) {
    const groups = useGroups();
    const parent = member?.parent;
    const hasParent = !!(parent?.name || parent?.phone || parent?.email);

    // The history opened from the card, over it; closing it is back on the card
    const [history, setHistory] = useState<'payments' | 'attendance' | null>(
        null,
    );

    return (
        <>
            <Dialog
                open={!!member}
                onClose={onClose}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                {member && (
                    <>
                        <PopupHeader
                            avatar={
                                <Avatar
                                    sx={{ width: 38, height: 38, fontSize: 15 }}
                                >
                                    {initials(member.name)}
                                </Avatar>
                            }
                            title={member.name}
                            subtitle={
                                <span className="inline-flex items-center gap-2">
                                    <GroupChip
                                        name={groupWithSubgroupName(
                                            groups,
                                            member.group_id,
                                            member.subgroup_id,
                                        )}
                                    />
                                    <StatusDot
                                        active={member.status === 'active'}
                                    />
                                </span>
                            }
                            onClose={onClose}
                        />

                        {(member.phone || member.email || hasParent) && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-[18px] pt-1 pb-4">
                                {member.phone && (
                                    <Detail label={t('Phone')}>
                                        <PhoneLink phone={member.phone} />
                                    </Detail>
                                )}
                                {member.email && (
                                    <Detail label={t('Email')} wide>
                                        <EmailLink email={member.email} />
                                    </Detail>
                                )}
                                {parent?.name && (
                                    <Detail label={t('Parent')}>
                                        {parent.name}
                                    </Detail>
                                )}
                                {parent?.phone && (
                                    <Detail label={t('Parent Phone')}>
                                        <PhoneLink phone={parent.phone} />
                                    </Detail>
                                )}
                                {parent?.email && (
                                    <Detail label={t('Parent email')} wide>
                                        <EmailLink email={parent.email} />
                                    </Detail>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col px-2 pb-3">
                            <ActionRow
                                tone="primary"
                                icon={<HistoryIcon fontSize="small" />}
                                onClick={() => setHistory('payments')}
                            >
                                {t('Payment history')}
                            </ActionRow>
                            <ActionRow
                                icon={<CalendarMonthIcon fontSize="small" />}
                                onClick={() => setHistory('attendance')}
                            >
                                {t('Attendance')}
                            </ActionRow>
                            {onEdit && (
                                <ActionRow
                                    icon={<EditIcon fontSize="small" />}
                                    onClick={() => {
                                        onClose();
                                        onEdit(member);
                                    }}
                                >
                                    {t('Edit')}
                                </ActionRow>
                            )}
                            {onDelete && (
                                <ActionRow
                                    tone="danger"
                                    icon={<DeleteIcon fontSize="small" />}
                                    onClick={() => {
                                        onClose();
                                        onDelete(member);
                                    }}
                                >
                                    {t('Delete')}
                                </ActionRow>
                            )}
                        </div>
                    </>
                )}
            </Dialog>

            <MemberPaymentsDialog
                member={history === 'payments' ? member : null}
                onClose={() => setHistory(null)}
            />
            <MemberAttendanceDialog
                member={history === 'attendance' ? member : null}
                onClose={() => setHistory(null)}
            />
        </>
    );
}

/** One action of a card, 48px high: icon and verb. */
function ActionRow({
    icon,
    tone = 'default',
    onClick,
    children,
}: {
    icon: ReactNode;
    tone?: 'primary' | 'default' | 'danger';
    onClick: () => void;
    children: ReactNode;
}) {
    const color = {
        primary:
            'text-hydra-blue hover:bg-[var(--popup-ghost)] dark:text-sky-300',
        default: 'text-[var(--popup-fg)] hover:bg-[var(--popup-ghost)]',
        danger: 'text-red-500 hover:bg-red-500/10',
    }[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-t border-[var(--popup-border)] px-3 text-left font-semibold ${color}`}
        >
            {icon}
            {children}
        </button>
    );
}

/** A small grey label with its value under it. */
function Detail({
    label,
    wide = false,
    children,
}: {
    label: string;
    wide?: boolean;
    children: ReactNode;
}) {
    return (
        <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
            <span className="block text-xs text-[var(--popup-muted)]">
                {label}
            </span>
            <span className="block truncate text-[15px] font-semibold text-[var(--popup-fg)]">
                {children}
            </span>
        </div>
    );
}

function PhoneLink({ phone }: { phone: string }) {
    return (
        <a
            href={`tel:${phone.replace(/[^\d+]/g, '')}`}
            className="text-hydra-blue dark:text-sky-300"
        >
            {phone}
        </a>
    );
}

function EmailLink({ email }: { email: string }) {
    return (
        <a
            href={`mailto:${email}`}
            className="text-hydra-blue dark:text-sky-300"
        >
            {email}
        </a>
    );
}
