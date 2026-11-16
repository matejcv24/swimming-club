import dayjs from 'dayjs';
import mkLocale from 'dayjs/locale/mk';
// The same file the server uses for its own text (lang/mk.json): English text as
// the key, Macedonian as the value
import mkTexts from '../../../lang/mk.json';

export type Locale = 'mk' | 'en';

/**
 * The app's language, chosen by the server for this page load (the MK / EN switch
 * in the header saves it and reloads the page).
 */
export const locale: Locale =
    typeof document !== 'undefined' && document.documentElement.lang === 'en'
        ? 'en'
        : 'mk';

const capitalize = (word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1);

// Macedonian with the month names capitalized (Ноември, not ноември), here and in
// the date pickers, which look the locale up by its name
dayjs.locale(
    {
        ...mkLocale,
        months: (mkLocale.months as string[]).map(capitalize),
        monthsShort: (mkLocale.monthsShort as string[]).map(capitalize),
    },
    undefined,
    true,
);

// Month and day names, and the first day of the week, in the app's language
dayjs.locale(locale);

const texts: Record<string, string> =
    locale === 'mk' ? (mkTexts as Record<string, string>) : {};

/** Puts the values into ":name" placeholders. */
function fill(text: string, params?: Record<string, string | number>): string {
    if (!params) {
        return text;
    }

    return text.replace(/:(\w+)/g, (match, name: string) =>
        name in params ? String(params[name]) : match,
    );
}

/**
 * Text in the app's language. Written in English, e.g. t('Save Attendance') or
 * t('Attendance - :name', { name }); the Macedonian is looked up in lang/mk.json
 * (English shows if a translation is missing).
 */
export function t(text: string, params?: Record<string, string | number>) {
    return fill(texts[text] ?? text, params);
}

/** Which plural form to use: 0 for one, 1 for many. */
function pluralForm(count: number): number {
    if (locale === 'mk') {
        // 1, 21, 31... take the singular in Macedonian (but not 11)
        return count % 10 === 1 && count % 100 !== 11 ? 0 : 1;
    }

    return count === 1 ? 0 : 1;
}

/**
 * Text with a number: tc(':count member|:count members', 5). The forms are
 * separated by "|", one first, then many.
 */
export function tc(
    text: string,
    count: number,
    params?: Record<string, string | number>,
) {
    const forms = (texts[text] ?? text).split('|');

    return fill(forms[Math.min(pluralForm(count), forms.length - 1)], {
        count,
        ...params,
    });
}

/** Switches the app to another language (kept for a year on this device). */
export function changeLocale(next: Locale) {
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
}

/** Labels of the date pickers' buttons and titles, in the app's language. */
export const pickerLocaleText = {
    cancelButtonLabel: t('Cancel'),
    okButtonLabel: t('OK'),
    clearButtonLabel: t('Clear'),
    todayButtonLabel: t('Today'),
    datePickerToolbarTitle: t('Select date'),
    previousMonth: t('Previous month'),
    nextMonth: t('Next month'),
};
