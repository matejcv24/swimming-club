import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::index
 * @see app/Http/Controllers/Api/MembershipFeeController.php:15
 * @route '/api/membership-fees'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/api/membership-fees',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::index
 * @see app/Http/Controllers/Api/MembershipFeeController.php:15
 * @route '/api/membership-fees'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::index
 * @see app/Http/Controllers/Api/MembershipFeeController.php:15
 * @route '/api/membership-fees'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::index
 * @see app/Http/Controllers/Api/MembershipFeeController.php:15
 * @route '/api/membership-fees'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::index
 * @see app/Http/Controllers/Api/MembershipFeeController.php:15
 * @route '/api/membership-fees'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::index
 * @see app/Http/Controllers/Api/MembershipFeeController.php:15
 * @route '/api/membership-fees'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::index
 * @see app/Http/Controllers/Api/MembershipFeeController.php:15
 * @route '/api/membership-fees'
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
 * @see \App\Http\Controllers\Api\MembershipFeeController::store
 * @see app/Http/Controllers/Api/MembershipFeeController.php:26
 * @route '/api/membership-fees'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/api/membership-fees',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::store
 * @see app/Http/Controllers/Api/MembershipFeeController.php:26
 * @route '/api/membership-fees'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::store
 * @see app/Http/Controllers/Api/MembershipFeeController.php:26
 * @route '/api/membership-fees'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::store
 * @see app/Http/Controllers/Api/MembershipFeeController.php:26
 * @route '/api/membership-fees'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::store
 * @see app/Http/Controllers/Api/MembershipFeeController.php:26
 * @route '/api/membership-fees'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;
/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::getByMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
export const getByMember = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: getByMember.url(args, options),
    method: 'get',
});

getByMember.definition = {
    methods: ['get', 'head'],
    url: '/api/membership-fees/by-member/{member}',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::getByMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
getByMember.url = (
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
        getByMember.definition.url
            .replace('{member}', parsedArgs.member.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::getByMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
getByMember.get = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: getByMember.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::getByMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
getByMember.head = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: getByMember.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::getByMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
const getByMemberForm = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: getByMember.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::getByMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
getByMemberForm.get = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: getByMember.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::getByMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
getByMemberForm.head = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: getByMember.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

getByMember.form = getByMemberForm;
const MembershipFeeController = { index, store, getByMember };

export default MembershipFeeController;
