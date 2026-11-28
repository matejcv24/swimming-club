import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { POPUP_BG } from '@/components/mui-theme-provider';
import {
    DrillRow,
    EmptyState,
    PopupHeader,
    SummaryCard,
    YearSection,
} from '@/components/popup-ui';
import { CardsSkeleton } from '@/components/skeletons';
import { groupNameOf, groupWithSubgroupName, useGroups } from '@/lib/groups';
import { t, tc } from '@/lib/i18n';

/** A training day a member came to. */
interface AttendanceRow {
    id: number;
    date: string;
    group_id: number | null;
    subgroup_id: number | null;
}

/**
 * A member's attendance: how many trainings this month and this year, the years
 * (only the newest open) with a row per month, and the dates of a month. Opened
 * from Attendance and from a member's card.
 */
export function MemberAttendanceDialog({
    member,
    onClose,
}: {
    member: { id: number; name: string; group_id: number | null } | null;
    onClose: () => void;
}) {
    const groups = useGroups();
    const selectedMember = member;
    const showMemberHistoryModal = !!member;
    const [showMonthDatesModal, setShowMonthDatesModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    // The opened member's training days (null while they load)
    const [history, setHistory] = useState<AttendanceRow[] | null>(null);
    const historyFor = useRef<number | null>(null);

    const openHistory = async (member: { id: number }) => {
        setHistory(null);
        historyFor.current = member.id;

        try {
            const response = await fetch(`/attendance/by-member/${member.id}`, {
                headers: { Accept: 'application/json' },
            });
            const data = await response.json();

            // Ignore an answer for a member who is no longer open
            if (historyFor.current === member.id) {
                setHistory(data.attendances ?? []);
            }
        } catch {
            if (historyFor.current === member.id) {
                setHistory([]);
            }
        }
    };

    const memberAttendanceRows = useMemo(
        () =>
            [...(history ?? [])].sort(
                (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
            ),
        [history],
    );

    const selectedMonthAttendances = selectedMonth
        ? memberAttendanceRows
              .filter(
                  (row) =>
                      dayjs(row.date).startOf('month').format('YYYY-MM-DD') ===
                      selectedMonth,
              )
              .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
        : [];

    const groupedByMonth = useMemo(() => {
        const grouped: Record<string, { month: string; total: number }> = {};

        memberAttendanceRows.forEach((row) => {
            const monthKey = dayjs(row.date)
                .startOf('month')
                .format('YYYY-MM-DD');

            if (!grouped[monthKey]) {
                grouped[monthKey] = {
                    month: monthKey,
                    total: 0,
                };
            }

            grouped[monthKey].total += 1;
        });

        return grouped;
    }, [memberAttendanceRows]);

    const sortedMonths = Object.keys(groupedByMonth).sort().reverse();
    const currentYear = dayjs().format('YYYY');
    const currentMonthKey = dayjs().startOf('month').format('YYYY-MM-DD');
    const currentMonthData = groupedByMonth[currentMonthKey] ?? null;

    const yearGroups: Record<
        string,
        { year: string; total: number; monthCount: number }
    > = {};

    Object.values(groupedByMonth).forEach((monthData) => {
        const year = dayjs(monthData.month).format('YYYY');

        if (!yearGroups[year]) {
            yearGroups[year] = {
                year,
                total: 0,
                monthCount: 0,
            };
        }

        yearGroups[year].total += monthData.total;
        yearGroups[year].monthCount += 1;
    });

    // Newest year first; only the newest starts open
    const allYears = Object.keys(yearGroups).sort().reverse();

    // The last training of a month (its rows are newest first)
    const lastDateOf = (month: string) =>
        memberAttendanceRows.find(
            (row) =>
                dayjs(row.date).startOf('month').format('YYYY-MM-DD') === month,
        )?.date;

    const closeHistory = onClose;

    const closeMonth = () => {
        setShowMonthDatesModal(false);
        setSelectedMonth(null);
    };

    // Loads whenever another member is opened
    useEffect(() => {
        if (member) {
            queueMicrotask(() => void openHistory(member));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [member?.id]);

    return (
        <>
            <Dialog
                open={showMemberHistoryModal}
                onClose={closeHistory}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <PopupHeader
                    icon={<CalendarMonthIcon fontSize="small" />}
                    title={t('Attendance')}
                    subtitle={
                        selectedMember
                            ? `${selectedMember.name} · ${groupNameOf(groups, selectedMember.group_id)}`
                            : ''
                    }
                    onClose={closeHistory}
                />

                <DialogContent sx={{ p: 0 }}>
                    {history === null ? (
                        <div className="px-[18px] pb-4">
                            <CardsSkeleton />
                        </div>
                    ) : memberAttendanceRows.length === 0 ? (
                        <EmptyState
                            icon={<CalendarMonthIcon />}
                            title={t('No attendance history yet.')}
                        />
                    ) : (
                        <>
                            <SummaryCard
                                tone="green"
                                title={t(':month: :count trainings', {
                                    month: dayjs().format('MMMM YYYY'),
                                    count: currentMonthData?.total ?? 0,
                                })}
                            >
                                {t(':year: :count trainings in :months', {
                                    year: currentYear,
                                    count: yearGroups[currentYear]?.total ?? 0,
                                    months: tc(
                                        ':count month|:count months',
                                        yearGroups[currentYear]?.monthCount ??
                                            0,
                                    ),
                                })}
                            </SummaryCard>
                            <ul className="border-t border-[var(--popup-border)]">
                                {allYears.map((year, index) => (
                                    <YearSection
                                        key={year}
                                        year={year}
                                        summary={tc(
                                            ':count training|:count trainings',
                                            yearGroups[year].total,
                                        )}
                                        defaultOpen={index === 0}
                                    >
                                        {sortedMonths
                                            .filter(
                                                (month) =>
                                                    dayjs(month).format(
                                                        'YYYY',
                                                    ) === year,
                                            )
                                            .map((month) => (
                                                <DrillRow
                                                    key={month}
                                                    title={dayjs(month).format(
                                                        'MMMM YYYY',
                                                    )}
                                                    subtitle={t('Last: :date', {
                                                        date: dayjs(
                                                            lastDateOf(month),
                                                        ).format('DD.MM.YYYY'),
                                                    })}
                                                    value={
                                                        groupedByMonth[month]
                                                            .total
                                                    }
                                                    valueClassName="text-green-600 dark:text-green-400"
                                                    onClick={() => {
                                                        setSelectedMonth(month);
                                                        setShowMonthDatesModal(
                                                            true,
                                                        );
                                                    }}
                                                />
                                            ))}
                                    </YearSection>
                                ))}
                            </ul>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={showMonthDatesModal}
                onClose={closeMonth}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <PopupHeader
                    icon={<CalendarMonthIcon fontSize="small" />}
                    title={
                        selectedMonth
                            ? dayjs(selectedMonth).format('MMMM YYYY')
                            : ''
                    }
                    subtitle={
                        selectedMember
                            ? `${selectedMember.name} · ${tc(':count training|:count trainings', selectedMonthAttendances.length)}`
                            : ''
                    }
                    onClose={closeMonth}
                />

                <DialogContent sx={{ p: 0 }}>
                    {selectedMonthAttendances.length > 0 ? (
                        <ul className="border-t border-[var(--popup-border)]">
                            {selectedMonthAttendances.map((attendance) => (
                                <li
                                    key={attendance.id}
                                    className="border-b border-[var(--popup-border)] px-[18px] py-3 last:border-b-0"
                                >
                                    <span className="block text-[15px] font-semibold text-[var(--popup-fg)] capitalize">
                                        {dayjs(attendance.date).format(
                                            'dddd, DD.MM.YYYY',
                                        )}
                                    </span>
                                    <span className="block text-[13px] text-[var(--popup-muted)]">
                                        {groupWithSubgroupName(
                                            groups,
                                            attendance.group_id,
                                            attendance.subgroup_id,
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            icon={<CalendarMonthIcon />}
                            title={t(
                                'No attendance dates recorded for this month.',
                            )}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
