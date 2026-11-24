import type { Auth } from '@/types/auth';
import type { ClubSharedData } from '@/types/club';
import type { NotificationSharedData } from '@/types/notifications';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            notifications: NotificationSharedData;
            club: ClubSharedData | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
