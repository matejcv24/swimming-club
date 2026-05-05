import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\AdminController::page
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
export const page = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: page.url(options),
    method: 'get',
});

page.definition = {
    methods: ['get', 'head'],
    url: '/invoices',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\AdminController::page
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
page.url = (options?: RouteQueryOptions) => {
    return page.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\AdminController::page
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
page.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: page.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\AdminController::page
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
page.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: page.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\AdminController::page
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
const pageForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: page.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\AdminController::page
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
pageForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: page.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\AdminController::page
 * @see app/Http/Controllers/AdminController.php:57
 * @route '/invoices'
 */
pageForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: page.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

page.form = pageForm;
const invoices = {
    page: Object.assign(page, page),
};

export default invoices;
