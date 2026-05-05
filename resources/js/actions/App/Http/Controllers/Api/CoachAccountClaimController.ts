import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\CoachAccountClaimController::store
 * @see app/Http/Controllers/Api/CoachAccountClaimController.php:14
 * @route '/api/claim-coach-account/{coach}'
 */
export const store = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/api/claim-coach-account/{coach}',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\Api\CoachAccountClaimController::store
 * @see app/Http/Controllers/Api/CoachAccountClaimController.php:14
 * @route '/api/claim-coach-account/{coach}'
 */
store.url = (
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
        store.definition.url
            .replace('{coach}', parsedArgs.coach.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\Api\CoachAccountClaimController::store
 * @see app/Http/Controllers/Api/CoachAccountClaimController.php:14
 * @route '/api/claim-coach-account/{coach}'
 */
store.post = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\CoachAccountClaimController::store
 * @see app/Http/Controllers/Api/CoachAccountClaimController.php:14
 * @route '/api/claim-coach-account/{coach}'
 */
const storeForm = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\CoachAccountClaimController::store
 * @see app/Http/Controllers/Api/CoachAccountClaimController.php:14
 * @route '/api/claim-coach-account/{coach}'
 */
storeForm.post = (
    args:
        | { coach: number | { id: number } }
        | [coach: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
});

store.form = storeForm;
const CoachAccountClaimController = { store };

export default CoachAccountClaimController;
