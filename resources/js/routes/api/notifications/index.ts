import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\NotificationController::index
 * @see app/Http/Controllers/Api/NotificationController.php:12
 * @route '/api/notifications'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/api/notifications',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\NotificationController::index
 * @see app/Http/Controllers/Api/NotificationController.php:12
 * @route '/api/notifications'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\NotificationController::index
 * @see app/Http/Controllers/Api/NotificationController.php:12
 * @route '/api/notifications'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\NotificationController::index
 * @see app/Http/Controllers/Api/NotificationController.php:12
 * @route '/api/notifications'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\NotificationController::index
 * @see app/Http/Controllers/Api/NotificationController.php:12
 * @route '/api/notifications'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\NotificationController::index
 * @see app/Http/Controllers/Api/NotificationController.php:12
 * @route '/api/notifications'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\NotificationController::index
 * @see app/Http/Controllers/Api/NotificationController.php:12
 * @route '/api/notifications'
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
 * @see \App\Http\Controllers\Api\NotificationController::readAll
 * @see app/Http/Controllers/Api/NotificationController.php:39
 * @route '/api/notifications/read-all'
 */
export const readAll = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: readAll.url(options),
    method: 'post',
});

readAll.definition = {
    methods: ['post'],
    url: '/api/notifications/read-all',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\Api\NotificationController::readAll
 * @see app/Http/Controllers/Api/NotificationController.php:39
 * @route '/api/notifications/read-all'
 */
readAll.url = (options?: RouteQueryOptions) => {
    return readAll.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\NotificationController::readAll
 * @see app/Http/Controllers/Api/NotificationController.php:39
 * @route '/api/notifications/read-all'
 */
readAll.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: readAll.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\NotificationController::readAll
 * @see app/Http/Controllers/Api/NotificationController.php:39
 * @route '/api/notifications/read-all'
 */
const readAllForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: readAll.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\NotificationController::readAll
 * @see app/Http/Controllers/Api/NotificationController.php:39
 * @route '/api/notifications/read-all'
 */
readAllForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: readAll.url(options),
    method: 'post',
});

readAll.form = readAllForm;
/**
 * @see \App\Http\Controllers\Api\NotificationController::read
 * @see app/Http/Controllers/Api/NotificationController.php:22
 * @route '/api/notifications/{notification}/read'
 */
export const read = (
    args:
        | { notification: string | { id: string } }
        | [notification: string | { id: string }]
        | string
        | { id: string },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: read.url(args, options),
    method: 'post',
});

read.definition = {
    methods: ['post'],
    url: '/api/notifications/{notification}/read',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\Api\NotificationController::read
 * @see app/Http/Controllers/Api/NotificationController.php:22
 * @route '/api/notifications/{notification}/read'
 */
read.url = (
    args:
        | { notification: string | { id: string } }
        | [notification: string | { id: string }]
        | string
        | { id: string },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { notification: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { notification: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            notification: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        notification:
            typeof args.notification === 'object'
                ? args.notification.id
                : args.notification,
    };

    return (
        read.definition.url
            .replace('{notification}', parsedArgs.notification.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\Api\NotificationController::read
 * @see app/Http/Controllers/Api/NotificationController.php:22
 * @route '/api/notifications/{notification}/read'
 */
read.post = (
    args:
        | { notification: string | { id: string } }
        | [notification: string | { id: string }]
        | string
        | { id: string },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: read.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\NotificationController::read
 * @see app/Http/Controllers/Api/NotificationController.php:22
 * @route '/api/notifications/{notification}/read'
 */
const readForm = (
    args:
        | { notification: string | { id: string } }
        | [notification: string | { id: string }]
        | string
        | { id: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: read.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\NotificationController::read
 * @see app/Http/Controllers/Api/NotificationController.php:22
 * @route '/api/notifications/{notification}/read'
 */
readForm.post = (
    args:
        | { notification: string | { id: string } }
        | [notification: string | { id: string }]
        | string
        | { id: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: read.url(args, options),
    method: 'post',
});

read.form = readForm;
const notifications = {
    index: Object.assign(index, index),
    readAll: Object.assign(readAll, readAll),
    read: Object.assign(read, read),
};

export default notifications;
