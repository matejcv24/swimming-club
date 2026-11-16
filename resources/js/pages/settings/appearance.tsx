import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { t } from '@/lib/i18n';

export default function Appearance() {
    return (
        <>
            <Head title={t('Appearance settings')} />

            <h1 className="sr-only">Appearance settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('Appearance settings')}
                    description={t("Update your account's appearance settings")}
                />
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: t('Appearance settings'),
            href: '/settings/appearance',
        },
    ],
};
