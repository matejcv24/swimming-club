import type { Auth } from '@/types/auth';
import type { NotificationSharedData } from '@/types/notifications';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            notifications: NotificationSharedData;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
