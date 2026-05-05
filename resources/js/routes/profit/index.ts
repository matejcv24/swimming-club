import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\ProfitController::index
 * @see app/Http/Controllers/ProfitController.php:7
 * @route '/profit'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/profit',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\ProfitController::index
 * @see app/Http/Controllers/ProfitController.php:7
 * @route '/profit'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\ProfitController::index
 * @see app/Http/Controllers/ProfitController.php:7
 * @route '/profit'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\ProfitController::index
 * @see app/Http/Controllers/ProfitController.php:7
 * @route '/profit'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\ProfitController::index
 * @see app/Http/Controllers/ProfitController.php:7
 * @route '/profit'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ProfitController::index
 * @see app/Http/Controllers/ProfitController.php:7
 * @route '/profit'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\ProfitController::index
 * @see app/Http/Controllers/ProfitController.php:7
 * @route '/profit'
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
