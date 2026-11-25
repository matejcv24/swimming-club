import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { t } from '@/lib/i18n';

/** Account settings: one page (name, email, password; admins also notifications). */
export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className="px-4 py-6">
            <Heading
                title={t('Account settings')}
                description={t('Your name, email and password')}
            />

            <section className="max-w-xl space-y-12">{children}</section>
        </div>
    );
}
