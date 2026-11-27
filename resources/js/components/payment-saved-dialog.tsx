import { router } from '@inertiajs/react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { POPUP_BG } from '@/components/mui-theme-provider';
import { FIELD_SX, PopupHeader } from '@/components/popup-ui';
import { t } from '@/lib/i18n';

/** The payment just recorded (from the server's "fee_saved"). */
export type SavedFee = {
    id: number;
    member_id: number;
    member: string;
    amount: number;
    payment_method: 'cash' | 'card';
    start_date: string | null;
    end_date: string | null;
    /** Where a confirmation would go (null: no email saved) */
    email: string | null;
    email_of: 'parent' | 'member' | null;
};

/** The confirmation email as the server will send it. */
type ConfirmationPreview = {
    email: string;
    source: 'parent' | 'member';
    recipient_name: string | null;
    member: string;
    subject: string;
    greeting: string;
    thanks: string;
    amount: string;
    period: string;
    signature: string;
    already_sent: string | null;
};

const date = (value: string | null) =>
    value ? dayjs(value).format('DD.MM.YYYY') : '';

/** The same two-line label next to the icon on phones as the other pop-ups' buttons. */
function TwoLineLabel({
    top,
    bottom,
    full,
}: {
    top: string;
    bottom: string;
    full: string;
}) {
    return (
        <>
            <span className="flex flex-col items-start text-left sm:hidden">
                <span>{top}</span>
                <span>{bottom}</span>
            </span>
            <span className="hidden sm:inline">{full}</span>
        </>
    );
}

/**
 * No email for the member or their parent yet: two fields (one is enough) and
 * saving them, shared by the "payment saved" pop-up and the confirmation
 * preview. After saving, the confirmation can be shown and sent.
 */
function useMissingEmail() {
    const [memberEmail, setMemberEmail] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [errors, setErrors] = useState<{
        member_email?: string;
        parent_email?: string;
    }>({});
    const [saving, setSaving] = useState(false);

    const reset = () => {
        setMemberEmail('');
        setParentEmail('');
        setErrors({});
    };

    const save = (memberId: number, onSaved: () => void) => {
        setSaving(true);
        setErrors({});
        router.post(
            `/unpaid-fees/${memberId}/email`,
            { member_email: memberEmail, parent_email: parentEmail },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    reset();
                    onSaved();
                },
                onError: (found) => setErrors(found),
                onFinish: () => setSaving(false),
            },
        );
    };

    const fields = (
        <>
            <p className="rounded-xl bg-amber-500/15 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                {t(
                    'No email is entered for this member or their parent, so no confirmation can be sent.',
                )}
            </p>
            <p className="-mt-1 text-sm text-[var(--popup-muted)]">
                {t(
                    'If you like, enter an email below and send the confirmation.',
                )}
            </p>
            <TextField
                label={t("Member's email")}
                type="email"
                size="small"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                error={!!errors.member_email}
                helperText={errors.member_email}
                fullWidth
                sx={FIELD_SX}
            />
            <TextField
                label={t('Parent email')}
                type="email"
                size="small"
                value={parentEmail}
                onChange={(event) => setParentEmail(event.target.value)}
                error={!!errors.parent_email}
                helperText={errors.parent_email}
                fullWidth
                sx={FIELD_SX}
            />
        </>
    );

    return {
        fields,
        typed: !!(memberEmail.trim() || parentEmail.trim()),
        saving,
        save,
        reset,
    };
}

/**
 * "Payment saved": what was recorded, and (for admins) an offer to email a
 * confirmation to the parent or the member. Nothing is sent from here: sending
 * opens the email first, exactly as it will go out.
 */
export function PaymentSavedDialog({
    fee,
    canSend,
    onClose,
    onSend,
}: {
    fee: SavedFee | null;
    /** Only admins send emails to parents; a coach just sees what was saved */
    canSend: boolean;
    /** "Not now" / "Close": the payment stays saved */
    onClose: () => void;
    /** Opens the confirmation email for this payment */
    onSend: (feeId: number) => void;
}) {
    // No email yet: an admin can enter one here (member's and/or parent's), then send
    const askEmail = canSend && !!fee && !fee.email;
    const missing = useMissingEmail();
    const savingEmail = missing.saving;
    const sendable = canSend && (!!fee?.email || missing.typed);

    const close = () => {
        missing.reset();
        onClose();
    };

    // Saves the entered email(s), then opens the confirmation email to send
    const send = () => {
        if (!fee) {
            return;
        }

        if (!askEmail) {
            onSend(fee.id);

            return;
        }

        missing.save(fee.member_id, () => onSend(fee.id));
    };

    return (
        <Dialog
            open={!!fee}
            onClose={() => !savingEmail && close()}
            disableRestoreFocus
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { bgcolor: POPUP_BG } }}
        >
            <DialogTitle sx={{ p: 0 }}>
                <PopupHeader
                    icon={<CheckCircleIcon fontSize="small" />}
                    title={t('Payment saved')}
                    onClose={close}
                />
            </DialogTitle>
            {fee && (
                <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                    <div className="flex flex-col gap-4 pb-2">
                        <div className="rounded-xl bg-[var(--popup-ghost)] px-3 py-2 text-sm leading-6 text-[var(--popup-fg)]">
                            <div className="font-bold">{fee.member}</div>
                            <div>
                                {Number(fee.amount).toLocaleString('mk-MK')} MKD
                                {' · '}
                                {fee.payment_method === 'card'
                                    ? t('Card')
                                    : t('Cash')}
                            </div>
                            <div>
                                {date(fee.start_date)} – {date(fee.end_date)}
                            </div>
                        </div>

                        {!canSend ? (
                            <p className="text-sm text-[var(--popup-muted)]">
                                {t(
                                    'An admin can send a confirmation email to the parent.',
                                )}
                            </p>
                        ) : fee.email ? (
                            <p className="text-sm text-[var(--popup-muted)]">
                                {fee.email_of === 'parent'
                                    ? t(
                                          'Send a confirmation email to the parent (:email)?',
                                          { email: fee.email },
                                      )
                                    : t(
                                          'Send a confirmation email to the member (:email)?',
                                          { email: fee.email },
                                      )}
                            </p>
                        ) : (
                            missing.fields
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={close}
                                disabled={savingEmail}
                            >
                                {canSend ? t('Not now') : t('Close')}
                            </Button>
                            {canSend && (
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<EmailIcon />}
                                    onClick={send}
                                    disabled={!sendable || savingEmail}
                                    sx={{
                                        whiteSpace: 'nowrap',
                                        px: 1.5,
                                        lineHeight: 1.15,
                                    }}
                                >
                                    <TwoLineLabel
                                        top={t('Send')}
                                        bottom={t('confirmation')}
                                        full={t('Send confirmation')}
                                    />
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}

/**
 * The confirmation email exactly as it will be sent, before sending: to whom,
 * the subject and the text. Cancel, or Send (like the payment reminder).
 */
export function ConfirmationPreviewDialog({
    feeId,
    onClose,
    onSent,
}: {
    feeId: number | null;
    onClose: () => void;
    onSent: () => void;
}) {
    const [preview, setPreview] = useState<ConfirmationPreview | null>(null);
    // No email yet: whose (the fields are shown instead of the email)
    const [noEmail, setNoEmail] = useState<{
        memberId: number;
        member: string;
    } | null>(null);
    // Loads the preview again after an email was entered
    const [reload, setReload] = useState(0);
    const missing = useMissingEmail();
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (feeId === null) {
            return;
        }

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setPreview(null);
            setNoEmail(null);
            setError(null);

            try {
                const response = await fetch(
                    `/membership-fees/${feeId}/confirmation`,
                    { headers: { Accept: 'application/json' } },
                );
                const body = await response.json();

                if (cancelled) {
                    return;
                }

                if (response.ok) {
                    setPreview(body);
                } else if (body?.no_email) {
                    setNoEmail({
                        memberId: body.member_id,
                        member: body.member,
                    });
                } else {
                    setError(
                        body?.errors?.confirmation?.[0] ??
                            t('The email could not be sent. Try again later.'),
                    );
                }
            } catch {
                if (!cancelled) {
                    setError(
                        t('The email could not be sent. Try again later.'),
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [feeId, reload]);

    const close = () => {
        missing.reset();
        onClose();
    };

    const send = () => {
        if (feeId === null) {
            return;
        }

        // First the email: saved, then the confirmation is shown to send
        if (noEmail) {
            missing.save(noEmail.memberId, () => setReload((n) => n + 1));

            return;
        }

        setSending(true);
        setError(null);
        router.post(
            `/membership-fees/${feeId}/confirmation`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => onSent(),
                onError: (errors) =>
                    setError(
                        errors.confirmation ??
                            t('The email could not be sent. Try again later.'),
                    ),
                onFinish: () => setSending(false),
            },
        );
    };

    return (
        <Dialog
            open={feeId !== null}
            onClose={() => !sending && !missing.saving && close()}
            disableRestoreFocus
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { bgcolor: POPUP_BG } }}
        >
            <DialogTitle sx={{ p: 0 }}>
                <PopupHeader
                    icon={<EmailIcon fontSize="small" />}
                    title={t('Payment confirmation')}
                    subtitle={preview?.member ?? noEmail?.member}
                    onClose={close}
                />
            </DialogTitle>
            <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                <div className="flex flex-col gap-4 pb-2">
                    {loading && (
                        <div className="flex justify-center py-8">
                            <CircularProgress size={28} />
                        </div>
                    )}

                    {preview && (
                        <>
                            <div className="text-sm text-[var(--popup-fg)]">
                                <span className="text-[var(--popup-muted)]">
                                    {t('To')}:{' '}
                                </span>
                                <b>{preview.email}</b>{' '}
                                <span className="text-[var(--popup-muted)]">
                                    (
                                    {preview.source === 'parent'
                                        ? t("parent's email")
                                        : t("member's own email")}
                                    )
                                </span>
                            </div>
                            <div className="text-sm text-[var(--popup-fg)]">
                                <span className="text-[var(--popup-muted)]">
                                    {t('Subject')}:{' '}
                                </span>
                                {preview.subject}
                            </div>

                            {/* The email's text, as it will look */}
                            <div className="flex flex-col gap-3 rounded-2xl border border-[var(--popup-border)] p-4 text-sm leading-6 text-[var(--popup-fg)]">
                                <p>{preview.greeting}</p>
                                <p>{preview.thanks}</p>
                                <p className="rounded-xl bg-green-500/15 px-3 py-2 text-green-800 dark:text-green-200">
                                    {preview.amount}
                                    <br />
                                    {preview.period}
                                </p>
                                <p className="text-[var(--popup-muted)]">
                                    {t(
                                        'The email also has a button “View attendance and payments”, working for 60 days.',
                                    )}
                                </p>
                                <p className="whitespace-pre-line">
                                    {preview.signature}
                                </p>
                            </div>

                            {preview.already_sent && (
                                <p className="text-sm text-[var(--popup-muted)]">
                                    {t(
                                        'Already sent on :date. Send again only if needed.',
                                        {
                                            date: dayjs(
                                                preview.already_sent,
                                            ).format('DD.MM.YYYY'),
                                        },
                                    )}
                                </p>
                            )}
                        </>
                    )}

                    {/* No email yet: the same two fields as after saving a payment */}
                    {noEmail && missing.fields}

                    {error && (
                        <p
                            role="alert"
                            className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500"
                        >
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3">
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={close}
                            disabled={sending || missing.saving}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            fullWidth
                            startIcon={<EmailIcon />}
                            onClick={send}
                            disabled={
                                sending ||
                                missing.saving ||
                                (noEmail ? !missing.typed : !preview)
                            }
                            sx={{
                                whiteSpace: 'nowrap',
                                px: 1.5,
                                lineHeight: 1.15,
                            }}
                        >
                            {sending ? (
                                t('Sending…')
                            ) : noEmail ? (
                                <TwoLineLabel
                                    top={t('Send')}
                                    bottom={t('confirmation')}
                                    full={t('Send confirmation')}
                                />
                            ) : (
                                t('Send')
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
