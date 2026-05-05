import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::show
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:13
 * @route '/api/settings/profile'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
});

show.definition = {
    methods: ['get', 'head'],
    url: '/api/settings/profile',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::show
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:13
 * @route '/api/settings/profile'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::show
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:13
 * @route '/api/settings/profile'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::show
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:13
 * @route '/api/settings/profile'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::show
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:13
 * @route '/api/settings/profile'
 */
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::show
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:13
 * @route '/api/settings/profile'
 */
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::show
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:13
 * @route '/api/settings/profile'
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
/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::update
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:22
 * @route '/api/settings/profile'
 */
export const update = (
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
});

update.definition = {
    methods: ['patch'],
    url: '/api/settings/profile',
} satisfies RouteDefinition<['patch']>;

/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::update
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:22
 * @route '/api/settings/profile'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::update
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:22
 * @route '/api/settings/profile'
 */
update.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::update
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:22
 * @route '/api/settings/profile'
 */
const updateForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\Settings\ProfileController::update
 * @see app/Http/Controllers/Api/Settings/ProfileController.php:22
 * @route '/api/settings/profile'
 */
updateForm.patch = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

update.form = updateForm;
const ProfileController = { show, update };

export default ProfileController;
