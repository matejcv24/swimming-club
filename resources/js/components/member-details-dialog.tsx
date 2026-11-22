import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { POPUP_BG } from '@/components/mui-theme-provider';
import { CloseButton, Hint } from '@/components/popup-ui';
import { groupWithSubgroupName, useGroups } from '@/lib/groups';
import { t } from '@/lib/i18n';

/** What the Member Details pop-up shows about a member. */
export interface MemberDetails {
    id: number;
    name: string;
    status: 'active' | 'inactive';
    group_id: number | null;
    subgroup_id: number | null;
    parent?: { name: string; phone: string } | null;
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
                        <Divider />
                        <div>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {t('Parent')}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {member.parent?.name ?? '—'}
                            </Typography>
                        </div>
                        <div>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {t('Parent Phone')}
                            </Typography>
                            <Typography variant="body1">
                                {member.parent?.phone ? (
                                    <Link
                                        href={`tel:${member.parent.phone.replace(/[^\d+]/g, '')}`}
                                        underline="none"
                                    >
                                        {member.parent.phone}
                                    </Link>
                                ) : (
                                    '—'
                                )}
                            </Typography>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
