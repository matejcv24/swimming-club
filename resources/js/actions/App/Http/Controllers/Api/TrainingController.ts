import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../../wayfinder';
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
 * @see \App\Http\Controllers\Api\TrainingController::getByDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
export const getByDate = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: getByDate.url(options),
    method: 'get',
});

getByDate.definition = {
    methods: ['get', 'head'],
    url: '/api/trainings/by-date',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\TrainingController::getByDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
getByDate.url = (options?: RouteQueryOptions) => {
    return getByDate.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\TrainingController::getByDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
getByDate.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getByDate.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\TrainingController::getByDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
getByDate.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getByDate.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\TrainingController::getByDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
const getByDateForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: getByDate.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\TrainingController::getByDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
getByDateForm.get = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: getByDate.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\TrainingController::getByDate
 * @see app/Http/Controllers/Api/TrainingController.php:77
 * @route '/api/trainings/by-date'
 */
getByDateForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: getByDate.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

getByDate.form = getByDateForm;
const TrainingController = { index, store, getByDate };

export default TrainingController;
