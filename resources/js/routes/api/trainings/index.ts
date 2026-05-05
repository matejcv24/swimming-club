import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\TrainingController::index
 * @see app/Http/Controllers/Api/TrainingController.php:17
 * @route '/api/trainings'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/api/trainings',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\TrainingController::index
 * @see app/Http/Controllers/Api/TrainingController.php:17
 * @route '/api/trainings'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\TrainingController::index
 * @see app/Http/Controllers/Api/TrainingController.php:17
 * @route '/api/trainings'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\TrainingController::index
 * @see app/Http/Controllers/Api/TrainingController.php:17
 * @route '/api/trainings'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\TrainingController::index
 * @see app/Http/Controllers/Api/TrainingController.php:17
 * @route '/api/trainings'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\TrainingController::index
 * @see app/Http/Controllers/Api/TrainingController.php:17
 * @route '/api/trainings'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\TrainingController::index
 * @see app/Http/Controllers/Api/TrainingController.php:17
 * @route '/api/trainings'
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
 * @see \App\Http\Controllers\Api\TrainingController::store
 * @see app/Http/Controllers/Api/TrainingController.php:26
 * @route '/api/trainings'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/api/trainings',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\Api\TrainingController::store
 * @see app/Http/Controllers/Api/TrainingController.php:26
 * @route '/api/trainings'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\TrainingController::store
 * @see app/Http/Controllers/Api/TrainingController.php:26
 * @route '/api/trainings'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\TrainingController::store
 * @see app/Http/Controllers/Api/TrainingController.php:26
 * @route '/api/trainings'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\TrainingController::store
 * @see app/Http/Controllers/Api/TrainingController.php:26
 * @route '/api/trainings'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;
/**
 * @see \App\Http\Controllers\Api\TrainingController::byDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
export const byDate = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: byDate.url(options),
    method: 'get',
});

byDate.definition = {
    methods: ['get', 'head'],
    url: '/api/trainings/by-date',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\TrainingController::byDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
byDate.url = (options?: RouteQueryOptions) => {
    return byDate.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\TrainingController::byDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
byDate.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: byDate.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\TrainingController::byDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
byDate.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: byDate.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\TrainingController::byDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
const byDateForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: byDate.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\TrainingController::byDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
byDateForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: byDate.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\TrainingController::byDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
byDateForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: byDate.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

byDate.form = byDateForm;
const trainings = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    byDate: Object.assign(byDate, byDate),
};

export default trainings;
