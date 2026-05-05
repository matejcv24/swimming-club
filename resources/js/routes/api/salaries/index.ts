import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\SalaryController::store
 * @see app/Http/Controllers/Api/SalaryController.php:15
 * @route '/api/salaries'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/api/salaries',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\Api\SalaryController::store
 * @see app/Http/Controllers/Api/SalaryController.php:15
 * @route '/api/salaries'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\SalaryController::store
 * @see app/Http/Controllers/Api/SalaryController.php:15
 * @route '/api/salaries'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\SalaryController::store
 * @see app/Http/Controllers/Api/SalaryController.php:15
 * @route '/api/salaries'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\SalaryController::store
 * @see app/Http/Controllers/Api/SalaryController.php:15
 * @route '/api/salaries'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;
/**
 * @see \App\Http\Controllers\Api\SalaryController::byCoach
 * @see app/Http/Controllers/Api/SalaryController.php:41
 * @route '/api/salaries/by-coach/{coach}'
 */
export const byCoach = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: byCoach.url(args, options),
    method: 'get',
});

byCoach.definition = {
    methods: ['get', 'head'],
    url: '/api/salaries/by-coach/{coach}',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\SalaryController::byCoach
 * @see app/Http/Controllers/Api/SalaryController.php:41
 * @route '/api/salaries/by-coach/{coach}'
 */
byCoach.url = (
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
        byCoach.definition.url
            .replace('{coach}', parsedArgs.coach.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\Api\SalaryController::byCoach
 * @see app/Http/Controllers/Api/SalaryController.php:41
 * @route '/api/salaries/by-coach/{coach}'
 */
byCoach.get = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: byCoach.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\SalaryController::byCoach
 * @see app/Http/Controllers/Api/SalaryController.php:41
 * @route '/api/salaries/by-coach/{coach}'
 */
byCoach.head = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: byCoach.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\SalaryController::byCoach
 * @see app/Http/Controllers/Api/SalaryController.php:41
 * @route '/api/salaries/by-coach/{coach}'
 */
const byCoachForm = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: byCoach.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\SalaryController::byCoach
 * @see app/Http/Controllers/Api/SalaryController.php:41
 * @route '/api/salaries/by-coach/{coach}'
 */
byCoachForm.get = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: byCoach.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\SalaryController::byCoach
 * @see app/Http/Controllers/Api/SalaryController.php:41
 * @route '/api/salaries/by-coach/{coach}'
 */
byCoachForm.head = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: byCoach.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

byCoach.form = byCoachForm;
const salaries = {
    store: Object.assign(store, store),
    byCoach: Object.assign(byCoach, byCoach),
};

export default salaries;
