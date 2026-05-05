import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../../wayfinder';
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
 * @see \App\Http\Controllers\Api\NotificationController::markAllAsRead
 * @see app/Http/Controllers/Api/NotificationController.php:39
 * @route '/api/notifications/read-all'
 */
export const markAllAsRead = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: markAllAsRead.url(options),
    method: 'post',
});

markAllAsRead.definition = {
    methods: ['post'],
    url: '/api/notifications/read-all',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\Api\NotificationController::markAllAsRead
 * @see app/Http/Controllers/Api/NotificationController.php:39
 * @route '/api/notifications/read-all'
 */
markAllAsRead.url = (options?: RouteQueryOptions) => {
    return markAllAsRead.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\NotificationController::markAllAsRead
 * @see app/Http/Controllers/Api/NotificationController.php:39
 * @route '/api/notifications/read-all'
 */
markAllAsRead.post = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: markAllAsRead.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\NotificationController::markAllAsRead
 * @see app/Http/Controllers/Api/NotificationController.php:39
 * @route '/api/notifications/read-all'
 */
const markAllAsReadForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: markAllAsRead.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\NotificationController::markAllAsRead
 * @see app/Http/Controllers/Api/NotificationController.php:39
 * @route '/api/notifications/read-all'
 */
markAllAsReadForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: markAllAsRead.url(options),
    method: 'post',
});

markAllAsRead.form = markAllAsReadForm;
/**
 * @see \App\Http\Controllers\Api\NotificationController::markAsRead
 * @see app/Http/Controllers/Api/NotificationController.php:22
 * @route '/api/notifications/{notification}/read'
 */
export const markAsRead = (
    args:
        | { notification: string | { id: string } }
        | [notification: string | { id: string }]
        | string
        | { id: string },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: markAsRead.url(args, options),
    method: 'post',
});

markAsRead.definition = {
    methods: ['post'],
    url: '/api/notifications/{notification}/read',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\Api\NotificationController::markAsRead
 * @see app/Http/Controllers/Api/NotificationController.php:22
 * @route '/api/notifications/{notification}/read'
 */
markAsRead.url = (
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
        markAsRead.definition.url
            .replace('{notification}', parsedArgs.notification.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\Api\NotificationController::markAsRead
 * @see app/Http/Controllers/Api/NotificationController.php:22
 * @route '/api/notifications/{notification}/read'
 */
markAsRead.post = (
    args:
        | { notification: string | { id: string } }
        | [notification: string | { id: string }]
        | string
        | { id: string },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: markAsRead.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\NotificationController::markAsRead
 * @see app/Http/Controllers/Api/NotificationController.php:22
 * @route '/api/notifications/{notification}/read'
 */
const markAsReadForm = (
    args:
        | { notification: string | { id: string } }
        | [notification: string | { id: string }]
        | string
        | { id: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: markAsRead.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\NotificationController::markAsRead
 * @see app/Http/Controllers/Api/NotificationController.php:22
 * @route '/api/notifications/{notification}/read'
 */
markAsReadForm.post = (
    args:
        | { notification: string | { id: string } }
        | [notification: string | { id: string }]
        | string
        | { id: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: markAsRead.url(args, options),
    method: 'post',
});

markAsRead.form = markAsReadForm;
const NotificationController = { index, markAllAsRead, markAsRead };

export default NotificationController;
