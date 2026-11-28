import { router } from '@inertiajs/react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { POPUP_BG } from '@/components/mui-theme-provider';
import { FIELD_SX, Note, PopupHeader } from '@/components/popup-ui';
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
    /** The club sends confirmations by itself, and this one already went out */
    auto_sent?: boolean;
};

/** One payment, as the pop-up shows it at the top. */
export type ConfirmationPayment = {
    id: number;
    member: string;
    amount: number;
    payment_method: 'cash' | 'card';
    start_date: string | null;
    end_date: string | null;
};

/** The confirmation email as the server will send it. */
type ConfirmationPreview = {
    email: string;
    source: 'parent' | 'member';
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
 * One pop-up, one step: the payment, who the confirmation email goes to (its
 * text one tap away), and "Send confirmation", which sends it straight away.
 * With no email saved, the member's and/or the parent's can be entered here:
 * "Save and send" does both. Used after saving a payment ("Payment saved") and
 * from the payment history.
 */
export function ConfirmationDialog({
    payment,
    saved,
    canSend,
    emailsOff = false,
    onClose,
    onSent,
}: {
    payment: ConfirmationPayment | null;
    /** Just recorded: titled "Payment saved", with "Not now" */
    saved: boolean;
    /** Only admins send emails; a coach only sees what was saved */
    canSend: boolean;
    /** The club switched confirmation emails off (Club settings) */
    emailsOff?: boolean;
    onClose: () => void;
    onSent: () => void;
}) {
    const [preview, setPreview] = useState<ConfirmationPreview | null>(null);
    // No email yet: whose (the two fields are shown instead)
    const [noEmail, setNoEmail] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [memberEmail, setMemberEmail] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{
        member_email?: string;
        parent_email?: string;
    }>({});
    const paymentId = payment?.id ?? null;
    const typed = !!(memberEmail.trim() || parentEmail.trim());

    useEffect(() => {
        if (paymentId === null || !canSend) {
            return;
        }

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setPreview(null);
            setNoEmail(null);
            setShowEmail(false);
            setError(null);
            setMemberEmail('');
            setParentEmail('');
            setFieldErrors({});

            try {
                const response = await fetch(
                    `/membership-fees/${paymentId}/confirmation`,
                    { headers: { Accept: 'application/json' } },
                );
                const body = await response.json();

                if (cancelled) {
                    return;
                }

                if (response.ok) {
                    setPreview(body);
                } else if (body?.no_email) {
                    setNoEmail(body.member_id);
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
    }, [paymentId, canSend]);

    const sendNow = () => {
        if (paymentId === null) {
            return;
        }

        setSending(true);
        setError(null);
        router.post(
            `/membership-fees/${paymentId}/confirmation`,
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

    // No email yet: saves the one(s) entered, then sends
    const saveAndSend = () => {
        if (noEmail === null) {
            return;
        }

        setSending(true);
        setFieldErrors({});
        router.post(
            `/unpaid-fees/${noEmail}/email`,
            { member_email: memberEmail, parent_email: parentEmail },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => sendNow(),
                onError: (errors) => {
                    setFieldErrors(errors);
                    setSending(false);
                },
            },
        );
    };

    const busy = sending || loading;

    return (
        <Dialog
            open={payment !== null}
            onClose={() => !sending && onClose()}
            disableRestoreFocus
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { bgcolor: POPUP_BG } }}
        >
            <DialogTitle sx={{ p: 0 }}>
                <PopupHeader
                    icon={
                        saved ? (
                            <CheckCircleIcon fontSize="small" />
                        ) : (
                            <EmailIcon fontSize="small" />
                        )
                    }
                    title={
                        saved ? t('Payment saved') : t('Payment confirmation')
                    }
                    onClose={onClose}
                />
            </DialogTitle>
            {payment && (
                <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                    <div className="flex flex-col gap-4 pb-2">
                        <div className="rounded-xl bg-[var(--popup-ghost)] px-3 py-2 text-sm leading-6 text-[var(--popup-fg)]">
                            <div className="font-bold">{payment.member}</div>
                            <div>
                                {Number(payment.amount).toLocaleString('mk-MK')}{' '}
                                MKD ·{' '}
                                {payment.payment_method === 'card'
                                    ? t('Card')
                                    : t('Cash')}
                            </div>
                            <div>
                                {date(payment.start_date)} –{' '}
                                {date(payment.end_date)}
                            </div>
                        </div>

                        {!canSend && (
                            <Note tone="info">
                                {emailsOff
                                    ? t(
                                          'Payment confirmations by email are switched off in the club settings.',
                                      )
                                    : t(
                                          'An admin can send a confirmation email to the parent.',
                                      )}
                            </Note>
                        )}

                        {loading && (
                            <div className="flex justify-center py-2">
                                <CircularProgress size={24} />
                            </div>
                        )}

                        {preview && (
                            <div className="flex flex-col gap-2 text-sm text-[var(--popup-fg)]">
                                <p>
                                    <span className="text-[var(--popup-muted)]">
                                        {t('Confirmation to')}:{' '}
                                    </span>
                                    <b>{preview.email}</b>{' '}
                                    <span className="text-[var(--popup-muted)]">
                                        (
                                        {preview.source === 'parent'
                                            ? t("parent's email")
                                            : t("member's own email")}
                                        )
                                    </span>
                                </p>
                                {preview.already_sent && (
                                    <p className="text-[var(--popup-muted)]">
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
                                <button
                                    type="button"
                                    onClick={() => setShowEmail(!showEmail)}
                                    aria-expanded={showEmail}
                                    className="-ml-1 inline-flex min-h-9 w-fit cursor-pointer items-center gap-1 rounded-full px-1 font-semibold text-hydra-blue dark:text-sky-300"
                                >
                                    {showEmail ? (
                                        <ExpandLessIcon fontSize="small" />
                                    ) : (
                                        <ExpandMoreIcon fontSize="small" />
                                    )}
                                    {showEmail
                                        ? t('Hide the email')
                                        : t('Show the email')}
                                </button>
                                {showEmail && (
                                    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--popup-border)] p-4 leading-6">
                                        <p className="text-[var(--popup-muted)]">
                                            {t('Subject')}: {preview.subject}
                                        </p>
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
                                )}
                            </div>
                        )}

                        {noEmail !== null && (
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
                                    onChange={(event) =>
                                        setMemberEmail(event.target.value)
                                    }
                                    error={!!fieldErrors.member_email}
                                    helperText={fieldErrors.member_email}
                                    fullWidth
                                    sx={FIELD_SX}
                                />
                                <TextField
                                    label={t('Parent email')}
                                    type="email"
                                    size="small"
                                    value={parentEmail}
                                    onChange={(event) =>
                                        setParentEmail(event.target.value)
                                    }
                                    error={!!fieldErrors.parent_email}
                                    helperText={fieldErrors.parent_email}
                                    fullWidth
                                    sx={FIELD_SX}
                                />
                            </>
                        )}

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
                                onClick={onClose}
                                disabled={sending}
                            >
                                {!canSend
                                    ? t('Close')
                                    : saved
                                      ? t('Not now')
                                      : t('Cancel')}
                            </Button>
                            {canSend && (
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<EmailIcon />}
                                    onClick={
                                        noEmail !== null ? saveAndSend : sendNow
                                    }
                                    disabled={
                                        busy ||
                                        (noEmail !== null ? !typed : !preview)
                                    }
                                    sx={{
                                        whiteSpace: 'nowrap',
                                        px: 1.5,
                                        lineHeight: 1.15,
                                    }}
                                >
                                    {sending ? (
                                        t('Sending…')
                                    ) : noEmail !== null ? (
                                        <TwoLineLabel
                                            top={t('Save and')}
                                            bottom={t('send')}
                                            full={t('Save and send')}
                                        />
                                    ) : (
                                        <TwoLineLabel
                                            top={t('Send')}
                                            bottom={t('confirmation')}
                                            full={t('Send confirmation')}
                                        />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}
