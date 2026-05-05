import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../wayfinder';
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
 * @see \App\Http\Controllers\Api\MembershipFeeController::byMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
export const byMember = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: byMember.url(args, options),
    method: 'get',
});

byMember.definition = {
    methods: ['get', 'head'],
    url: '/api/membership-fees/by-member/{member}',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::byMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
byMember.url = (
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
        byMember.definition.url
            .replace('{member}', parsedArgs.member.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::byMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
byMember.get = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: byMember.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::byMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
byMember.head = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: byMember.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::byMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
const byMemberForm = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: byMember.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::byMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
byMemberForm.get = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: byMember.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\MembershipFeeController::byMember
 * @see app/Http/Controllers/Api/MembershipFeeController.php:57
 * @route '/api/membership-fees/by-member/{member}'
 */
byMemberForm.head = (
    args:
        | { member: number | { id: number } }
        | [member: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: byMember.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

byMember.form = byMemberForm;
const membershipFees = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    byMember: Object.assign(byMember, byMember),
};

export default membershipFees;
