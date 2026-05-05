import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\AttendanceController::index
 * @see app/Http/Controllers/Api/AttendanceController.php:13
 * @route '/api/attendance'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/api/attendance',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\AttendanceController::index
 * @see app/Http/Controllers/Api/AttendanceController.php:13
 * @route '/api/attendance'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\AttendanceController::index
 * @see app/Http/Controllers/Api/AttendanceController.php:13
 * @route '/api/attendance'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\AttendanceController::index
 * @see app/Http/Controllers/Api/AttendanceController.php:13
 * @route '/api/attendance'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\AttendanceController::index
 * @see app/Http/Controllers/Api/AttendanceController.php:13
 * @route '/api/attendance'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\AttendanceController::index
 * @see app/Http/Controllers/Api/AttendanceController.php:13
 * @route '/api/attendance'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\AttendanceController::index
 * @see app/Http/Controllers/Api/AttendanceController.php:13
 * @route '/api/attendance'
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
const attendance = {
    index: Object.assign(index, index),
};

export default attendance;
