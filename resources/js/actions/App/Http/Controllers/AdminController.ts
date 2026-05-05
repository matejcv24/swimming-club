import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:14
 * @route '/dashboard'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/dashboard',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:14
 * @route '/dashboard'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:14
 * @route '/dashboard'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:14
 * @route '/dashboard'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:14
 * @route '/dashboard'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:14
 * @route '/dashboard'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:14
 * @route '/dashboard'
 */
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

index.form = indexForm;
/**
 * @see \App\Http\Controllers\AdminController::invoices
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
export const invoices = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: invoices.url(options),
    method: 'get',
});

invoices.definition = {
    methods: ['get', 'head'],
    url: '/invoices',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\AdminController::invoices
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
invoices.url = (options?: RouteQueryOptions) => {
    return invoices.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\AdminController::invoices
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
invoices.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoices.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\AdminController::invoices
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
invoices.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: invoices.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\AdminController::invoices
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
const invoicesForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: invoices.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\AdminController::invoices
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
invoicesForm.get = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: invoices.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\AdminController::invoices
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
invoicesForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: invoices.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

invoices.form = invoicesForm;
const AdminController = { index, invoices };

export default AdminController;
