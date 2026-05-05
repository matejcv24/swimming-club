import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\MemberController::index
 * @see app/Http/Controllers/Api/MemberController.php:14
 * @route '/api/members'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/api/members',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\MemberController::index
 * @see app/Http/Controllers/Api/MemberController.php:14
 * @route '/api/members'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\MemberController::index
 * @see app/Http/Controllers/Api/MemberController.php:14
 * @route '/api/members'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\MemberController::index
 * @see app/Http/Controllers/Api/MemberController.php:14
 * @route '/api/members'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\MemberController::index
 * @see app/Http/Controllers/Api/MemberController.php:14
 * @route '/api/members'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\MemberController::index
 * @see app/Http/Controllers/Api/MemberController.php:14
 * @route '/api/members'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\MemberController::index
 * @see app/Http/Controllers/Api/MemberController.php:14
 * @route '/api/members'
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
 * @see \App\Http\Controllers\Api\MemberController::store
 * @see app/Http/Controllers/Api/MemberController.php:21
 * @route '/api/members'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/api/members',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\Api\MemberController::store
 * @see app/Http/Controllers/Api/MemberController.php:21
 * @route '/api/members'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\MemberController::store
 * @see app/Http/Controllers/Api/MemberController.php:21
 * @route '/api/members'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\MemberController::store
 * @see app/Http/Controllers/Api/MemberController.php:21
 * @route '/api/members'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\MemberController::store
 * @see app/Http/Controllers/Api/MemberController.php:21
 * @route '/api/members'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;
/**
 * @see \App\Http\Controllers\Api\MemberController::update
 * @see app/Http/Controllers/Api/MemberController.php:39
 * @route '/api/members/{member}'
 */
export const update = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

update.definition = {
    methods: ['patch'],
    url: '/api/members/{member}',
} satisfies RouteDefinition<['patch']>;

/**
 * @see \App\Http\Controllers\Api\MemberController::update
 * @see app/Http/Controllers/Api/MemberController.php:39
 * @route '/api/members/{member}'
 */
update.url = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { member: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { member: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            member: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        member: typeof args.member === 'object' ? args.member.id : args.member,
    };

    return (
        update.definition.url
            .replace('{member}', parsedArgs.member.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\Api\MemberController::update
 * @see app/Http/Controllers/Api/MemberController.php:39
 * @route '/api/members/{member}'
 */
update.patch = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\Api\MemberController::update
 * @see app/Http/Controllers/Api/MemberController.php:39
 * @route '/api/members/{member}'
 */
const updateForm = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\MemberController::update
 * @see app/Http/Controllers/Api/MemberController.php:39
 * @route '/api/members/{member}'
 */
updateForm.patch = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

update.form = updateForm;
const members = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    update: Object.assign(update, update),
};

export default members;
