import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\MembershipFeeController::byMember
 * @see app/Http/Controllers/MembershipFeeController.php:56
 * @route '/membership-fees/by-member/{member}'
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
    url: '/membership-fees/by-member/{member}',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\MembershipFeeController::byMember
 * @see app/Http/Controllers/MembershipFeeController.php:56
 * @route '/membership-fees/by-member/{member}'
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
 * @see \App\Http\Controllers\MembershipFeeController::byMember
 * @see app/Http/Controllers/MembershipFeeController.php:56
 * @route '/membership-fees/by-member/{member}'
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
 * @see \App\Http\Controllers\MembershipFeeController::byMember
 * @see app/Http/Controllers/MembershipFeeController.php:56
 * @route '/membership-fees/by-member/{member}'
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
 * @see \App\Http\Controllers\MembershipFeeController::byMember
 * @see app/Http/Controllers/MembershipFeeController.php:56
 * @route '/membership-fees/by-member/{member}'
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
 * @see \App\Http\Controllers\MembershipFeeController::byMember
 * @see app/Http/Controllers/MembershipFeeController.php:56
 * @route '/membership-fees/by-member/{member}'
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
 * @see \App\Http\Controllers\MembershipFeeController::byMember
 * @see app/Http/Controllers/MembershipFeeController.php:56
 * @route '/membership-fees/by-member/{member}'
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
/**
 * @see \App\Http\Controllers\MembershipFeeController::index
 * @see app/Http/Controllers/MembershipFeeController.php:14
 * @route '/membership-fees'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/membership-fees',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\MembershipFeeController::index
 * @see app/Http/Controllers/MembershipFeeController.php:14
 * @route '/membership-fees'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\MembershipFeeController::index
 * @see app/Http/Controllers/MembershipFeeController.php:14
 * @route '/membership-fees'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MembershipFeeController::index
 * @see app/Http/Controllers/MembershipFeeController.php:14
 * @route '/membership-fees'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::index
 * @see app/Http/Controllers/MembershipFeeController.php:14
 * @route '/membership-fees'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::index
 * @see app/Http/Controllers/MembershipFeeController.php:14
 * @route '/membership-fees'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MembershipFeeController::index
 * @see app/Http/Controllers/MembershipFeeController.php:14
 * @route '/membership-fees'
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
 * @see \App\Http\Controllers\MembershipFeeController::create
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/create'
 */
export const create = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
});

create.definition = {
    methods: ['get', 'head'],
    url: '/membership-fees/create',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\MembershipFeeController::create
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\MembershipFeeController::create
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MembershipFeeController::create
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::create
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/create'
 */
const createForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::create
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/create'
 */
createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MembershipFeeController::create
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/create'
 */
createForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: create.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

create.form = createForm;
/**
 * @see \App\Http\Controllers\MembershipFeeController::store
 * @see app/Http/Controllers/MembershipFeeController.php:29
 * @route '/membership-fees'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/membership-fees',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\MembershipFeeController::store
 * @see app/Http/Controllers/MembershipFeeController.php:29
 * @route '/membership-fees'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\MembershipFeeController::store
 * @see app/Http/Controllers/MembershipFeeController.php:29
 * @route '/membership-fees'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::store
 * @see app/Http/Controllers/MembershipFeeController.php:29
 * @route '/membership-fees'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::store
 * @see app/Http/Controllers/MembershipFeeController.php:29
 * @route '/membership-fees'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;
/**
 * @see \App\Http\Controllers\MembershipFeeController::show
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
export const show = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
});

show.definition = {
    methods: ['get', 'head'],
    url: '/membership-fees/{membership_fee}',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\MembershipFeeController::show
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
show.url = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { membership_fee: args };
    }

    if (Array.isArray(args)) {
        args = {
            membership_fee: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        membership_fee: args.membership_fee,
    };

    return (
        show.definition.url
            .replace('{membership_fee}', parsedArgs.membership_fee.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\MembershipFeeController::show
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
show.get = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MembershipFeeController::show
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
show.head = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::show
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
const showForm = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::show
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
showForm.get = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MembershipFeeController::show
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
showForm.head = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

show.form = showForm;
/**
 * @see \App\Http\Controllers\MembershipFeeController::edit
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}/edit'
 */
export const edit = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
});

edit.definition = {
    methods: ['get', 'head'],
    url: '/membership-fees/{membership_fee}/edit',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\MembershipFeeController::edit
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}/edit'
 */
edit.url = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { membership_fee: args };
    }

    if (Array.isArray(args)) {
        args = {
            membership_fee: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        membership_fee: args.membership_fee,
    };

    return (
        edit.definition.url
            .replace('{membership_fee}', parsedArgs.membership_fee.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\MembershipFeeController::edit
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}/edit'
 */
edit.get = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MembershipFeeController::edit
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}/edit'
 */
edit.head = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::edit
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}/edit'
 */
const editForm = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::edit
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}/edit'
 */
editForm.get = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MembershipFeeController::edit
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}/edit'
 */
editForm.head = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: edit.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

edit.form = editForm;
/**
 * @see \App\Http\Controllers\MembershipFeeController::update
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
export const update = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});

update.definition = {
    methods: ['put', 'patch'],
    url: '/membership-fees/{membership_fee}',
} satisfies RouteDefinition<['put', 'patch']>;

/**
 * @see \App\Http\Controllers\MembershipFeeController::update
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
update.url = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { membership_fee: args };
    }

    if (Array.isArray(args)) {
        args = {
            membership_fee: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        membership_fee: args.membership_fee,
    };

    return (
        update.definition.url
            .replace('{membership_fee}', parsedArgs.membership_fee.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\MembershipFeeController::update
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
update.put = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});
/**
 * @see \App\Http\Controllers\MembershipFeeController::update
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
update.patch = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::update
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
const updateForm = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::update
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
updateForm.put = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});
/**
 * @see \App\Http\Controllers\MembershipFeeController::update
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
updateForm.patch = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
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
/**
 * @see \App\Http\Controllers\MembershipFeeController::destroy
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
export const destroy = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

destroy.definition = {
    methods: ['delete'],
    url: '/membership-fees/{membership_fee}',
} satisfies RouteDefinition<['delete']>;

/**
 * @see \App\Http\Controllers\MembershipFeeController::destroy
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
destroy.url = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { membership_fee: args };
    }

    if (Array.isArray(args)) {
        args = {
            membership_fee: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        membership_fee: args.membership_fee,
    };

    return (
        destroy.definition.url
            .replace('{membership_fee}', parsedArgs.membership_fee.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\MembershipFeeController::destroy
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
destroy.delete = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::destroy
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
const destroyForm = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\MembershipFeeController::destroy
 * @see app/Http/Controllers/MembershipFeeController.php:0
 * @route '/membership-fees/{membership_fee}'
 */
destroyForm.delete = (
    args:
        | { membership_fee: string | number }
        | [membership_fee: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

destroy.form = destroyForm;
const membershipFees = {
    byMember: Object.assign(byMember, byMember),
    index: Object.assign(index, index),
    create: Object.assign(create, create),
    store: Object.assign(store, store),
    show: Object.assign(show, show),
    edit: Object.assign(edit, edit),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
};

export default membershipFees;
