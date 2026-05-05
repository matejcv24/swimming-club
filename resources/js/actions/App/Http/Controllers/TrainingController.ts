import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:7
 * @route '/trainings'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/trainings',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:7
 * @route '/trainings'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:7
 * @route '/trainings'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:7
 * @route '/trainings'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:7
 * @route '/trainings'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:7
 * @route '/trainings'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:7
 * @route '/trainings'
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
const TrainingController = { index };

export default TrainingController;
