export class ApiValidationError extends Error {
    errors: Record<string, string[]>;

    constructor(message: string, errors: Record<string, string[]>) {
        super(message);
        this.name = 'ApiValidationError';
        this.errors = errors;
    }
}

interface ApiRequestOptions {
    method?: string;
    body?: unknown;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

const getCsrfToken = () =>
    document
        .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
        ?.getAttribute('content') ?? '';

export async function apiRequest<T>(
    url: string,
    options: ApiRequestOptions = {},
): Promise<T> {
    const headers: HeadersInit = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    const request: RequestInit = {
        method: options.method ?? 'GET',
        credentials: 'same-origin',
        headers,
    };

    if (request.method !== 'GET') {
        headers['X-CSRF-TOKEN'] = getCsrfToken();
    }

    if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        request.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, request);

    if (response.status === 422) {
        const data = (await response.json()) as ApiErrorResponse;

        throw new ApiValidationError(
            data.message ?? 'Please check the form.',
            data.errors ?? {},
        );
    }

    if (!response.ok) {
        const data = (await response
            .json()
            .catch(() => null)) as ApiErrorResponse | null;

        throw new Error(data?.message ?? 'The request failed.');
    }

    if (response.status === 204) {
        return null as T;
    }

    return (await response.json()) as T;
}
