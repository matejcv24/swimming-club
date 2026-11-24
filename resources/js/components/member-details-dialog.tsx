import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { POPUP_BG } from '@/components/mui-theme-provider';
import { CloseButton, Hint } from '@/components/popup-ui';
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

/** A member's details, as opened from the Members list (and elsewhere). */
export function MemberDetailsDialog({
    member,
    onClose,
}: {
    member: MemberDetails | null;
    onClose: () => void;
}) {
    const groups = useGroups();

    return (
        <Dialog
            open={!!member}
            onClose={onClose}
            disableRestoreFocus
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { bgcolor: POPUP_BG } }}
        >
            <DialogTitle sx={{ p: 0 }}>
                <div className="flex items-center justify-between px-4 py-3">
                    <Hint title={t('Back')}>
                        <IconButton onClick={onClose} aria-label={t('Back')}>
                            <ArrowBackIcon />
                        </IconButton>
                    </Hint>
                    <Typography variant="h6" fontWeight="bold">
                        {t('Member Details')}
                    </Typography>
                    <CloseButton onClick={onClose} />
                </div>
                <Divider />
            </DialogTitle>

            <DialogContent>
                {member && (
                    <div className="space-y-4 py-4">
                        <div>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {t('Member')}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {member.name}
                            </Typography>
                        </div>
                        <div>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {t('Status')}
                            </Typography>
                            <Typography
                                variant="body1"
                                color={
                                    member.status === 'active'
                                        ? 'success.main'
                                        : 'error.main'
                                }
                            >
                                {member.status === 'active'
                                    ? t('Active')
                                    : t('Inactive')}
                            </Typography>
                        </div>

                        <div>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {t('Group')}
                            </Typography>
                            <Typography variant="body1">
                                {groupWithSubgroupName(
                                    groups,
                                    member.group_id,
                                    member.subgroup_id,
                                )}
                            </Typography>
                        </div>
                        {(member.phone || member.email) && (
                            <>
                                <Divider />
                                <Detail label={t('Phone')}>
                                    <PhoneLink phone={member.phone} />
                                </Detail>
                                <Detail label={t('Email')}>
                                    <EmailLink email={member.email} />
                                </Detail>
                            </>
                        )}
                        {(member.parent?.name ||
                            member.parent?.phone ||
                            member.parent?.email) && (
                            <>
                                <Divider />
                                <Detail label={t('Parent')} bold>
                                    {member.parent?.name || '—'}
                                </Detail>
                                <Detail label={t('Parent Phone')}>
                                    <PhoneLink phone={member.parent?.phone} />
                                </Detail>
                                <Detail label={t('Parent email')}>
                                    <EmailLink email={member.parent?.email} />
                                </Detail>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

/** A small caption with its value under it. */
function Detail({
    label,
    bold = false,
    children,
}: {
    label: string;
    bold?: boolean;
    children: ReactNode;
}) {
    return (
        <div>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body1" fontWeight={bold ? 'bold' : undefined}>
                {children}
            </Typography>
        </div>
    );
}

function PhoneLink({ phone }: { phone?: string | null }) {
    return phone ? (
        <Link href={`tel:${phone.replace(/[^\d+]/g, '')}`} underline="none">
            {phone}
        </Link>
    ) : (
        <>—</>
    );
}

function EmailLink({ email }: { email?: string | null }) {
    return email ? (
        <Link href={`mailto:${email}`} underline="none">
            {email}
        </Link>
    ) : (
        <>—</>
    );
}
