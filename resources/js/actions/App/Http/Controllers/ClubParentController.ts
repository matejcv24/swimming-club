import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\ClubParentController::store
 * @see app/Http/Controllers/ClubParentController.php:10
 * @route '/parents'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/parents',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\ClubParentController::store
 * @see app/Http/Controllers/ClubParentController.php:10
 * @route '/parents'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\ClubParentController::store
 * @see app/Http/Controllers/ClubParentController.php:10
 * @route '/parents'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\ClubParentController::store
 * @see app/Http/Controllers/ClubParentController.php:10
 * @route '/parents'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\ClubParentController::store
 * @see app/Http/Controllers/ClubParentController.php:10
 * @route '/parents'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;
const ClubParentController = { store };

export default ClubParentController;
