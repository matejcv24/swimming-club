import { usePage } from '@inertiajs/react';
import { t } from '@/lib/i18n';

/** A subgroup of a club group (e.g. "Big pool" → "18:00"). */
export type ClubSubgroup = {
    id: number;
    name: string;
    members_count: number;
};

/** A club-made group (e.g. "Mon-Wed-Fri", "Big pool"), shared with every page. */
export type ClubGroup = ClubSubgroup & {
    subgroups: ClubSubgroup[];
};

/** The club's groups, in their order, each with its subgroups. */
export function useGroups(): ClubGroup[] {
    const { groups } = usePage().props as { groups?: ClubGroup[] };

    return groups ?? [];
}

/**
 * A group's name; records of a deleted group fall back to their own copy of it.
 * No group: a member (or their payment) of all groups.
 */
export function groupNameOf(
    groups: ClubGroup[],
    id: number | null | undefined,
    fallback?: string | null,
): string {
    if (id === null && !fallback) {
        return t('All groups');
    }

    return groups.find((group) => group.id === id)?.name ?? fallback ?? '—';
}

/** The subgroups of one group (none when the group is unknown). */
export function subgroupsOf(
    groups: ClubGroup[],
    groupId: number | null | undefined,
): ClubSubgroup[] {
    return groups.find((group) => group.id === groupId)?.subgroups ?? [];
}

/** "Big pool · 18:00", or just "Big pool" without a subgroup. */
export function groupWithSubgroupName(
    groups: ClubGroup[],
    groupId: number | null | undefined,
    subgroupId: number | null | undefined,
): string {
    const name = groupNameOf(groups, groupId);
    const subgroup = subgroupsOf(groups, groupId).find(
        (s) => s.id === subgroupId,
    );

    return subgroup ? `${name} · ${subgroup.name}` : name;
}
