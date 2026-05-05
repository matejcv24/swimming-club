import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\UnpaidFeeController::index
 * @see app/Http/Controllers/Api/UnpaidFeeController.php:12
 * @route '/api/unpaid-fees'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/api/unpaid-fees',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\UnpaidFeeController::index
 * @see app/Http/Controllers/Api/UnpaidFeeController.php:12
 * @route '/api/unpaid-fees'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\UnpaidFeeController::index
 * @see app/Http/Controllers/Api/UnpaidFeeController.php:12
 * @route '/api/unpaid-fees'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\UnpaidFeeController::index
 * @see app/Http/Controllers/Api/UnpaidFeeController.php:12
 * @route '/api/unpaid-fees'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\UnpaidFeeController::index
 * @see app/Http/Controllers/Api/UnpaidFeeController.php:12
 * @route '/api/unpaid-fees'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\UnpaidFeeController::index
 * @see app/Http/Controllers/Api/UnpaidFeeController.php:12
 * @route '/api/unpaid-fees'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\UnpaidFeeController::index
 * @see app/Http/Controllers/Api/UnpaidFeeController.php:12
 * @route '/api/unpaid-fees'
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
const unpaidFees = {
    index: Object.assign(index, index),
};

export default unpaidFees;
