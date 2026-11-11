/**
 * Shared behaviour for every search field in the app: clicking a field that
 * still holds the previous search clears it, so the next search starts from
 * scratch. Spread the result onto the field: <TextField {...clearOnClick(...)} />
 */
export function clearOnClick(hasText: boolean, clear: () => void) {
    return {
        onClick: () => {
            if (hasText) {
                clear();
            }
        },
    };
}
