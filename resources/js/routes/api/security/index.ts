import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\Settings\SecurityController::show
 * @see app/Http/Controllers/Api/Settings/SecurityController.php:13
 * @route '/api/settings/security'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
});

show.definition = {
    methods: ['get', 'head'],
    url: '/api/settings/security',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\Settings\SecurityController::show
 * @see app/Http/Controllers/Api/Settings/SecurityController.php:13
 * @route '/api/settings/security'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\Settings\SecurityController::show
 * @see app/Http/Controllers/Api/Settings/SecurityController.php:13
 * @route '/api/settings/security'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\Settings\SecurityController::show
 * @see app/Http/Controllers/Api/Settings/SecurityController.php:13
 * @route '/api/settings/security'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\Settings\SecurityController::show
 * @see app/Http/Controllers/Api/Settings/SecurityController.php:13
 * @route '/api/settings/security'
 */
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\Settings\SecurityController::show
 * @see app/Http/Controllers/Api/Settings/SecurityController.php:13
 * @route '/api/settings/security'
 */
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\Settings\SecurityController::show
 * @see app/Http/Controllers/Api/Settings/SecurityController.php:13
 * @route '/api/settings/security'
 */
showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

show.form = showForm;
const security = {
    show: Object.assign(show, show),
};

export default security;
