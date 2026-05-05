import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:15
 * @route '/staff'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/staff',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:15
 * @route '/staff'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:15
 * @route '/staff'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:15
 * @route '/staff'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:15
 * @route '/staff'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:15
 * @route '/staff'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:15
 * @route '/staff'
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
 * @see \App\Http\Controllers\StaffController::store
 * @see app/Http/Controllers/StaffController.php:20
 * @route '/staff'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/staff',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\StaffController::store
 * @see app/Http/Controllers/StaffController.php:20
 * @route '/staff'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\StaffController::store
 * @see app/Http/Controllers/StaffController.php:20
 * @route '/staff'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\StaffController::store
 * @see app/Http/Controllers/StaffController.php:20
 * @route '/staff'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\StaffController::store
 * @see app/Http/Controllers/StaffController.php:20
 * @route '/staff'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;
const staff = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
};

export default staff;
