import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import dayjs from 'dayjs';
import { useState } from 'react';
import { PopupHeader } from '@/components/popup-ui';

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

type Props = {
    open: boolean;
    onClose: () => void;
    firstYear?: number | null;
    paperColor: string;
};

export default function MonthlyReportDialog({
    open,
    onClose,
    firstYear,
    paperColor,
}: Props) {
    // Default to last month: that's the one usually being reported on
    const lastMonth = dayjs().subtract(1, 'month');
    const currentYear = dayjs().year();
    const startYear = Math.min(firstYear ?? lastMonth.year(), lastMonth.year());
    const years = Array.from(
        { length: currentYear - startYear + 1 },
        (_, i) => currentYear - i,
    );

    const [year, setYear] = useState(lastMonth.year());
    const [month, setMonth] = useState(lastMonth.month() + 1);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // No future months in the current year
    const lastSelectableMonth = year === currentYear ? dayjs().month() + 1 : 12;

    const changeYear = (newYear: number) => {
        setYear(newYear);

        if (newYear === currentYear && month > dayjs().month() + 1) {
            setMonth(dayjs().month() + 1);
        }
    };

    const download = async () => {
        setDownloading(true);
        setError(null);

        try {
            const response = await fetch(
                `/reports/monthly?year=${year}&month=${month}`,
                { headers: { Accept: 'application/pdf' } },
            );

            if (!response.ok) {
                throw new Error(`Status ${response.status}`);
            }

            const url = URL.createObjectURL(await response.blob());
            const link = document.createElement('a');
            link.href = url;
            link.download = `SC-Hydra-Report-${MONTHS[month - 1]}-${year}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
            onClose();
        } catch {
            setError('The report could not be generated. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={downloading ? undefined : onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { bgcolor: paperColor } }}
        >
            <DialogTitle sx={{ p: 0 }}>
                <PopupHeader
                    icon={<DescriptionIcon fontSize="small" />}
                    title="Monthly report"
                    subtitle="Fees, invoices and salaries for one month"
                    onClose={() => !downloading && onClose()}
                />
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <div className="flex flex-col gap-4 px-[18px] pt-1 pb-[18px]">
                    <div className="grid grid-cols-2 gap-3">
                        <FormControl fullWidth>
                            <InputLabel id="report-year-label">Year</InputLabel>
                            <Select
                                labelId="report-year-label"
                                label="Year"
                                value={year}
                                onChange={(e) =>
                                    changeYear(Number(e.target.value))
                                }
                            >
                                {years.map((y) => (
                                    <MenuItem key={y} value={y}>
                                        {y}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel id="report-month-label">
                                Month
                            </InputLabel>
                            <Select
                                labelId="report-month-label"
                                label="Month"
                                value={month}
                                onChange={(e) =>
                                    setMonth(Number(e.target.value))
                                }
                            >
                                {MONTHS.slice(0, lastSelectableMonth).map(
                                    (name, i) => (
                                        <MenuItem key={name} value={i + 1}>
                                            {name}
                                        </MenuItem>
                                    ),
                                )}
                            </Select>
                        </FormControl>
                    </div>

                    {error && <Alert severity="error">{error}</Alert>}

                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={download}
                        disabled={downloading}
                        startIcon={
                            downloading ? (
                                <CircularProgress size={18} color="inherit" />
                            ) : (
                                <DownloadIcon />
                            )
                        }
                    >
                        {downloading ? 'Generating...' : 'Download PDF'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
