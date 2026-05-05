import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\StaffController::showClaimForm
 * @see app/Http/Controllers/StaffController.php:50
 * @route '/claim-coach-account/{coach}'
 */
export const showClaimForm = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: showClaimForm.url(args, options),
    method: 'get',
});

showClaimForm.definition = {
    methods: ['get', 'head'],
    url: '/claim-coach-account/{coach}',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\StaffController::showClaimForm
 * @see app/Http/Controllers/StaffController.php:50
 * @route '/claim-coach-account/{coach}'
 */
showClaimForm.url = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { coach: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { coach: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            coach: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        coach: typeof args.coach === 'object' ? args.coach.id : args.coach,
    };

    return (
        showClaimForm.definition.url
            .replace('{coach}', parsedArgs.coach.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\StaffController::showClaimForm
 * @see app/Http/Controllers/StaffController.php:50
 * @route '/claim-coach-account/{coach}'
 */
showClaimForm.get = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: showClaimForm.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\StaffController::showClaimForm
 * @see app/Http/Controllers/StaffController.php:50
 * @route '/claim-coach-account/{coach}'
 */
showClaimForm.head = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: showClaimForm.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\StaffController::showClaimForm
 * @see app/Http/Controllers/StaffController.php:50
 * @route '/claim-coach-account/{coach}'
 */
const showClaimFormForm = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: showClaimForm.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\StaffController::showClaimForm
 * @see app/Http/Controllers/StaffController.php:50
 * @route '/claim-coach-account/{coach}'
 */
showClaimFormForm.get = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: showClaimForm.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\StaffController::showClaimForm
 * @see app/Http/Controllers/StaffController.php:50
 * @route '/claim-coach-account/{coach}'
 */
showClaimFormForm.head = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: showClaimForm.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

showClaimForm.form = showClaimFormForm;
/**
 * @see \App\Http\Controllers\StaffController::claimAccount
 * @see app/Http/Controllers/StaffController.php:65
 * @route '/claim-coach-account/{coach}'
 */
export const claimAccount = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: claimAccount.url(args, options),
    method: 'post',
});

claimAccount.definition = {
    methods: ['post'],
    url: '/claim-coach-account/{coach}',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\StaffController::claimAccount
 * @see app/Http/Controllers/StaffController.php:65
 * @route '/claim-coach-account/{coach}'
 */
claimAccount.url = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { coach: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { coach: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            coach: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        coach: typeof args.coach === 'object' ? args.coach.id : args.coach,
    };

    return (
        claimAccount.definition.url
            .replace('{coach}', parsedArgs.coach.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\StaffController::claimAccount
 * @see app/Http/Controllers/StaffController.php:65
 * @route '/claim-coach-account/{coach}'
 */
claimAccount.post = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: claimAccount.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\StaffController::claimAccount
 * @see app/Http/Controllers/StaffController.php:65
 * @route '/claim-coach-account/{coach}'
 */
const claimAccountForm = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: claimAccount.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\StaffController::claimAccount
 * @see app/Http/Controllers/StaffController.php:65
 * @route '/claim-coach-account/{coach}'
 */
claimAccountForm.post = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: claimAccount.url(args, options),
    method: 'post',
});

claimAccount.form = claimAccountForm;
/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:16
 * @route '/staff'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/staff',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:16
 * @route '/staff'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:16
 * @route '/staff'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:16
 * @route '/staff'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:16
 * @route '/staff'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:16
 * @route '/staff'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\StaffController::index
 * @see app/Http/Controllers/StaffController.php:16
 * @route '/staff'
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
 * @see \App\Http\Controllers\StaffController::store
 * @see app/Http/Controllers/StaffController.php:25
 * @route '/staff'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/staff',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\StaffController::store
 * @see app/Http/Controllers/StaffController.php:25
 * @route '/staff'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\StaffController::store
 * @see app/Http/Controllers/StaffController.php:25
 * @route '/staff'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\StaffController::store
 * @see app/Http/Controllers/StaffController.php:25
 * @route '/staff'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\StaffController::store
 * @see app/Http/Controllers/StaffController.php:25
 * @route '/staff'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;
const StaffController = { showClaimForm, claimAccount, index, store };

export default StaffController;
