import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\MemberController::index
 * @see app/Http/Controllers/MemberController.php:7
 * @route '/members'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/members',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\MemberController::index
 * @see app/Http/Controllers/MemberController.php:7
 * @route '/members'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\MemberController::index
 * @see app/Http/Controllers/MemberController.php:7
 * @route '/members'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MemberController::index
 * @see app/Http/Controllers/MemberController.php:7
 * @route '/members'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\MemberController::index
 * @see app/Http/Controllers/MemberController.php:7
 * @route '/members'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\MemberController::index
 * @see app/Http/Controllers/MemberController.php:7
 * @route '/members'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MemberController::index
 * @see app/Http/Controllers/MemberController.php:7
 * @route '/members'
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
const members = {
    index: Object.assign(index, index),
};

export default members;
