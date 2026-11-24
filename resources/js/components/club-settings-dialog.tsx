import { router, useForm, usePage } from '@inertiajs/react';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ClubMark } from '@/components/club-mark';
import { MuiThemeProvider, POPUP_BG } from '@/components/mui-theme-provider';
import { FIELD_SX, PopupHeader } from '@/components/popup-ui';
import { t } from '@/lib/i18n';
import type { ClubSharedData } from '@/types/club';

/** The biggest logo file taken, as the server also checks. */
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * The club's name, email and logo: opened from the club name in the top bar, by
 * the club's admins. Shown in the top bar, in emails and on reports.
 */
export function ClubSettingsDialog({ onClose }: { onClose: () => void }) {
    const { club } = usePage().props as { club: ClubSharedData | null };
    const form = useForm<{
        name: string;
        email: string;
        logo: File | null;
    }>({
        name: club?.name ?? '',
        email: club?.email ?? '',
        logo: null,
    });
    const fileInput = useRef<HTMLInputElement>(null);
    // The newly chosen picture, shown before it is saved
    const [preview, setPreview] = useState<string | null>(null);
    const [logoError, setLogoError] = useState<string | null>(null);
    // "Are you sure?" before a logo is deleted
    const [confirmingRemove, setConfirmingRemove] = useState(false);
    const [removing, setRemoving] = useState(false);

    const currentLogo = preview ?? club?.logo_url ?? null;

    const chooseLogo = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        // Let the same file be chosen again later
        event.target.value = '';

        if (!file) {
            return;
        }

        if (!LOGO_TYPES.includes(file.type)) {
            setLogoError(t('Choose a PNG, JPG or WebP picture.'));

            return;
        }

        if (file.size > MAX_LOGO_BYTES) {
            setLogoError(t('This picture is too big (up to 2 MB).'));

            return;
        }

        setLogoError(null);

        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setPreview(URL.createObjectURL(file));
        form.setData('logo', file);
    };

    // After the question is answered yes: a picture only chosen (not saved) is
    // dropped, and a saved logo is deleted at once
    const removeLogo = () => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setPreview(null);
        setLogoError(null);
        form.setData('logo', null);

        if (!club?.logo_url) {
            setConfirmingRemove(false);

            return;
        }

        setRemoving(true);
        router.delete('/club/logo', {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setRemoving(false);
                setConfirmingRemove(false);
            },
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/club', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <MuiThemeProvider>
            <Dialog
                open
                onClose={onClose}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<BusinessIcon fontSize="small" />}
                        title={t('Club settings')}
                        subtitle={t('Shown in the top bar, emails and reports')}
                        onClose={onClose}
                    />
                </DialogTitle>

                <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                    <form
                        onSubmit={submit}
                        // Room above the first field: its floating label sits on the
                        // border and would be cut off at the top of the content
                        className="flex flex-col gap-5 pt-3 pb-2"
                    >
                        <TextField
                            label={t('Club name')}
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            error={!!form.errors.name}
                            helperText={form.errors.name}
                            required
                            fullWidth
                            autoFocus
                            slotProps={{ htmlInput: { maxLength: 120 } }}
                            sx={FIELD_SX}
                        />

                        <TextField
                            label={t('Club email')}
                            type="email"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                            error={!!form.errors.email}
                            helperText={
                                form.errors.email ??
                                t('Replies to the club’s emails come here')
                            }
                            required
                            fullWidth
                            // Small enough to stay on one line in every language
                            slotProps={{
                                formHelperText: {
                                    sx: { fontSize: 11, whiteSpace: 'nowrap' },
                                },
                            }}
                            sx={FIELD_SX}
                        />

                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-semibold text-[var(--popup-fg)]">
                                {t('Logo')}{' '}
                                <span className="font-normal text-[var(--popup-muted)]">
                                    ({t('optional')})
                                </span>
                            </span>
                            <div className="flex items-center gap-3">
                                <ClubMark
                                    name={form.data.name}
                                    logoUrl={currentLogo}
                                    className="size-14 text-lg"
                                />
                                <div className="flex min-w-0 flex-col items-start gap-1">
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        size="small"
                                        startIcon={<UploadIcon />}
                                        onClick={() =>
                                            fileInput.current?.click()
                                        }
                                    >
                                        {t('Upload logo')}
                                    </Button>
                                    {currentLogo && (
                                        <Button
                                            type="button"
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            startIcon={<DeleteIcon />}
                                            onClick={() =>
                                                setConfirmingRemove(true)
                                            }
                                        >
                                            {t('Remove logo')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <input
                                ref={fileInput}
                                type="file"
                                accept={LOGO_TYPES.join(',')}
                                onChange={chooseLogo}
                                className="hidden"
                            />
                            <p className="text-xs text-[var(--popup-muted)]">
                                {t('PNG, JPG, WebP · up to 2 MB')}
                            </p>
                            {(logoError ?? form.errors.logo) && (
                                <p className="text-sm text-red-500">
                                    {logoError ?? form.errors.logo}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outlined"
                                fullWidth
                                size="medium"
                                onClick={onClose}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="medium"
                                disabled={form.processing}
                            >
                                {t('Save')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Are you sure? */}
            <Dialog
                open={confirmingRemove}
                onClose={() => !removing && setConfirmingRemove(false)}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <div className="flex flex-col gap-4 p-5">
                    <div>
                        <p className="text-base font-bold text-[var(--popup-fg)]">
                            {t('Remove the logo?')}
                        </p>
                        <p className="mt-1 text-sm text-[var(--popup-muted)]">
                            {t(
                                'The logo will be deleted. You can upload a new one any time.',
                            )}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outlined"
                            fullWidth
                            disabled={removing}
                            onClick={() => setConfirmingRemove(false)}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button
                            type="button"
                            variant="contained"
                            color="error"
                            fullWidth
                            startIcon={<DeleteIcon />}
                            disabled={removing}
                            onClick={removeLogo}
                        >
                            {t('Remove')}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </MuiThemeProvider>
    );
}
