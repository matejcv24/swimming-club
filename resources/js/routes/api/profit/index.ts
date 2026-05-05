import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\ProfitController::index
 * @see app/Http/Controllers/Api/ProfitController.php:14
 * @route '/api/profit'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/api/profit',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\ProfitController::index
 * @see app/Http/Controllers/Api/ProfitController.php:14
 * @route '/api/profit'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\ProfitController::index
 * @see app/Http/Controllers/Api/ProfitController.php:14
 * @route '/api/profit'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\ProfitController::index
 * @see app/Http/Controllers/Api/ProfitController.php:14
 * @route '/api/profit'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\ProfitController::index
 * @see app/Http/Controllers/Api/ProfitController.php:14
 * @route '/api/profit'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\ProfitController::index
 * @see app/Http/Controllers/Api/ProfitController.php:14
 * @route '/api/profit'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\ProfitController::index
 * @see app/Http/Controllers/Api/ProfitController.php:14
 * @route '/api/profit'
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
const profit = {
    index: Object.assign(index, index),
};

export default profit;
