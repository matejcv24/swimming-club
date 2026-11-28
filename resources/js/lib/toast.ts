/**
 * Short messages at the bottom of the screen that confirm an action after its
 * pop-up has closed: saved, sent, deleted (with an optional undo) or an error.
 * One at a time: a new one replaces the one on screen.
 */
export type ToastTone = 'saved' | 'sent' | 'deleted' | 'error';

export type Toast = {
    id: number;
    tone: ToastTone;
    message: string;
    /** "Undo" next to the message; only for things that can be brought back. */
    undo?: () => void;
};

type Listener = (toast: Toast | null) => void;

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((listener) => listener(current));

export function showToast(
    message: string,
    tone: ToastTone = 'saved',
    undo?: () => void,
): void {
    current = { id: nextId++, tone, message, undo };
    emit();
}

export function hideToast(id?: number): void {
    if (id === undefined || current?.id === id) {
        current = null;
        emit();
    }
}

export function subscribeToast(listener: Listener): () => void {
    listeners.add(listener);
    listener(current);

    return () => {
        listeners.delete(listener);
    };
}
