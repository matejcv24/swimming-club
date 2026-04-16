import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:12
 * @route '/trainings'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/trainings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:12
 * @route '/trainings'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:12
 * @route '/trainings'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:12
 * @route '/trainings'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:12
 * @route '/trainings'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:12
 * @route '/trainings'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\TrainingController::index
 * @see app/Http/Controllers/TrainingController.php:12
 * @route '/trainings'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\TrainingController::create
 * @see app/Http/Controllers/TrainingController.php:20
 * @route '/trainings/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/trainings/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TrainingController::create
 * @see app/Http/Controllers/TrainingController.php:20
 * @route '/trainings/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TrainingController::create
 * @see app/Http/Controllers/TrainingController.php:20
 * @route '/trainings/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\TrainingController::create
 * @see app/Http/Controllers/TrainingController.php:20
 * @route '/trainings/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\TrainingController::create
 * @see app/Http/Controllers/TrainingController.php:20
 * @route '/trainings/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\TrainingController::create
 * @see app/Http/Controllers/TrainingController.php:20
 * @route '/trainings/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\TrainingController::create
 * @see app/Http/Controllers/TrainingController.php:20
 * @route '/trainings/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\TrainingController::store
 * @see app/Http/Controllers/TrainingController.php:28
 * @route '/trainings'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/trainings',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TrainingController::store
 * @see app/Http/Controllers/TrainingController.php:28
 * @route '/trainings'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TrainingController::store
 * @see app/Http/Controllers/TrainingController.php:28
 * @route '/trainings'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\TrainingController::store
 * @see app/Http/Controllers/TrainingController.php:28
 * @route '/trainings'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\TrainingController::store
 * @see app/Http/Controllers/TrainingController.php:28
 * @route '/trainings'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\TrainingController::show
 * @see app/Http/Controllers/TrainingController.php:36
 * @route '/trainings/{training}'
 */
export const show = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/trainings/{training}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TrainingController::show
 * @see app/Http/Controllers/TrainingController.php:36
 * @route '/trainings/{training}'
 */
show.url = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { training: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    training: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        training: args.training,
                }

    return show.definition.url
            .replace('{training}', parsedArgs.training.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TrainingController::show
 * @see app/Http/Controllers/TrainingController.php:36
 * @route '/trainings/{training}'
 */
show.get = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\TrainingController::show
 * @see app/Http/Controllers/TrainingController.php:36
 * @route '/trainings/{training}'
 */
show.head = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\TrainingController::show
 * @see app/Http/Controllers/TrainingController.php:36
 * @route '/trainings/{training}'
 */
    const showForm = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\TrainingController::show
 * @see app/Http/Controllers/TrainingController.php:36
 * @route '/trainings/{training}'
 */
        showForm.get = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\TrainingController::show
 * @see app/Http/Controllers/TrainingController.php:36
 * @route '/trainings/{training}'
 */
        showForm.head = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\TrainingController::edit
 * @see app/Http/Controllers/TrainingController.php:44
 * @route '/trainings/{training}/edit'
 */
export const edit = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/trainings/{training}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TrainingController::edit
 * @see app/Http/Controllers/TrainingController.php:44
 * @route '/trainings/{training}/edit'
 */
edit.url = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { training: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    training: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        training: args.training,
                }

    return edit.definition.url
            .replace('{training}', parsedArgs.training.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TrainingController::edit
 * @see app/Http/Controllers/TrainingController.php:44
 * @route '/trainings/{training}/edit'
 */
edit.get = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\TrainingController::edit
 * @see app/Http/Controllers/TrainingController.php:44
 * @route '/trainings/{training}/edit'
 */
edit.head = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\TrainingController::edit
 * @see app/Http/Controllers/TrainingController.php:44
 * @route '/trainings/{training}/edit'
 */
    const editForm = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\TrainingController::edit
 * @see app/Http/Controllers/TrainingController.php:44
 * @route '/trainings/{training}/edit'
 */
        editForm.get = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\TrainingController::edit
 * @see app/Http/Controllers/TrainingController.php:44
 * @route '/trainings/{training}/edit'
 */
        editForm.head = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\TrainingController::update
 * @see app/Http/Controllers/TrainingController.php:52
 * @route '/trainings/{training}'
 */
export const update = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/trainings/{training}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\TrainingController::update
 * @see app/Http/Controllers/TrainingController.php:52
 * @route '/trainings/{training}'
 */
update.url = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { training: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    training: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        training: args.training,
                }

    return update.definition.url
            .replace('{training}', parsedArgs.training.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TrainingController::update
 * @see app/Http/Controllers/TrainingController.php:52
 * @route '/trainings/{training}'
 */
update.put = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\TrainingController::update
 * @see app/Http/Controllers/TrainingController.php:52
 * @route '/trainings/{training}'
 */
update.patch = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\TrainingController::update
 * @see app/Http/Controllers/TrainingController.php:52
 * @route '/trainings/{training}'
 */
    const updateForm = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\TrainingController::update
 * @see app/Http/Controllers/TrainingController.php:52
 * @route '/trainings/{training}'
 */
        updateForm.put = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\TrainingController::update
 * @see app/Http/Controllers/TrainingController.php:52
 * @route '/trainings/{training}'
 */
        updateForm.patch = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\TrainingController::destroy
 * @see app/Http/Controllers/TrainingController.php:60
 * @route '/trainings/{training}'
 */
export const destroy = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/trainings/{training}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\TrainingController::destroy
 * @see app/Http/Controllers/TrainingController.php:60
 * @route '/trainings/{training}'
 */
destroy.url = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { training: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    training: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        training: args.training,
                }

    return destroy.definition.url
            .replace('{training}', parsedArgs.training.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TrainingController::destroy
 * @see app/Http/Controllers/TrainingController.php:60
 * @route '/trainings/{training}'
 */
destroy.delete = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\TrainingController::destroy
 * @see app/Http/Controllers/TrainingController.php:60
 * @route '/trainings/{training}'
 */
    const destroyForm = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\TrainingController::destroy
 * @see app/Http/Controllers/TrainingController.php:60
 * @route '/trainings/{training}'
 */
        destroyForm.delete = (args: { training: string | number } | [training: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const TrainingController = { index, create, store, show, edit, update, destroy }

export default TrainingController