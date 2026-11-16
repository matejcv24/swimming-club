import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { POPUP_FG, popupFg } from '@/components/mui-theme-provider';
import type { ClubGroup } from '@/lib/groups';
import { t } from '@/lib/i18n';

/** A coach works with all groups, or with the chosen ones. */
export type CoachGroups = { all_groups: boolean; group_ids: number[] };

const ALL = 'all';

/** "All groups" or the names of the chosen groups. */
export function coachGroupsLabel(
    value: CoachGroups,
    groups: ClubGroup[],
): string {
    if (value.all_groups) {
        return t('All groups');
    }

    const names = groups
        .filter((group) => value.group_ids.includes(group.id))
        .map((group) => group.name);

    return names.length > 0 ? names.join(', ') : t('No groups');
}

/** Drop-down for the groups a coach is assigned to: all, or one or more. */
export function CoachGroupsField({
    id,
    value,
    onChange,
    groups,
    error,
}: {
    id: string;
    value: CoachGroups;
    onChange: (value: CoachGroups) => void;
    groups: ClubGroup[];
    error?: string;
}) {
    const selected = value.all_groups
        ? [ALL]
        : value.group_ids.map((groupId) => String(groupId));

    const handleChange = (next: string[]) => {
        // Picking "All groups" replaces single groups, and the other way round
        const pickedAll = next.includes(ALL) && !value.all_groups;

        if (pickedAll) {
            onChange({ all_groups: true, group_ids: [] });

            return;
        }

        onChange({
            all_groups: false,
            group_ids: next
                .filter((item) => item !== ALL)
                .map((item) => Number(item)),
        });
    };

    return (
        <FormControl fullWidth required error={!!error}>
            <InputLabel id={id} sx={{ color: popupFg(0.5) }}>
                {t('Groups')}
            </InputLabel>
            <Select
                labelId={id}
                multiple
                label={t('Groups')}
                value={selected}
                onChange={(e) =>
                    handleChange(
                        typeof e.target.value === 'string'
                            ? e.target.value.split(',')
                            : e.target.value,
                    )
                }
                renderValue={() => coachGroupsLabel(value, groups)}
                sx={{
                    color: POPUP_FG,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: popupFg(0.3),
                    },
                    '& .MuiSvgIcon-root': { color: POPUP_FG },
                }}
            >
                <MenuItem value={ALL}>
                    <Checkbox checked={value.all_groups} />
                    <ListItemText
                        primary={t('All groups')}
                        secondary={t('Including groups added later')}
                    />
                </MenuItem>
                <Divider />
                {groups.map((group) => (
                    <MenuItem key={group.id} value={String(group.id)}>
                        <Checkbox
                            checked={
                                !value.all_groups &&
                                value.group_ids.includes(group.id)
                            }
                        />
                        <ListItemText primary={group.name} />
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText>
                {error ??
                    t(
                        'The coach only sees, adds and edits members, trainings and payments of these groups.',
                    )}
            </FormHelperText>
        </FormControl>
    );
}
