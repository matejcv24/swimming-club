import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../../wayfinder';
/**
 * @see \App\Http\Controllers\Api\InvoiceController::index
 * @see app/Http/Controllers/Api/InvoiceController.php:12
 * @route '/api/invoices'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/api/invoices',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\InvoiceController::index
 * @see app/Http/Controllers/Api/InvoiceController.php:12
 * @route '/api/invoices'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\InvoiceController::index
 * @see app/Http/Controllers/Api/InvoiceController.php:12
 * @route '/api/invoices'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\InvoiceController::index
 * @see app/Http/Controllers/Api/InvoiceController.php:12
 * @route '/api/invoices'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\InvoiceController::index
 * @see app/Http/Controllers/Api/InvoiceController.php:12
 * @route '/api/invoices'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\InvoiceController::index
 * @see app/Http/Controllers/Api/InvoiceController.php:12
 * @route '/api/invoices'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\InvoiceController::index
 * @see app/Http/Controllers/Api/InvoiceController.php:12
 * @route '/api/invoices'
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
 * @see \App\Http\Controllers\Api\InvoiceController::store
 * @see app/Http/Controllers/Api/InvoiceController.php:33
 * @route '/api/invoices'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/api/invoices',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\Api\InvoiceController::store
 * @see app/Http/Controllers/Api/InvoiceController.php:33
 * @route '/api/invoices'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Api\InvoiceController::store
 * @see app/Http/Controllers/Api/InvoiceController.php:33
 * @route '/api/invoices'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\InvoiceController::store
 * @see app/Http/Controllers/Api/InvoiceController.php:33
 * @route '/api/invoices'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\Api\InvoiceController::store
 * @see app/Http/Controllers/Api/InvoiceController.php:33
 * @route '/api/invoices'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;
/**
 * @see \App\Http\Controllers\Api\InvoiceController::getByMonth
 * @see app/Http/Controllers/Api/InvoiceController.php:19
 * @route '/api/invoices/by-month/{month}'
 */
export const getByMonth = (
    args:
        | { month: string | number }
        | [month: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: getByMonth.url(args, options),
    method: 'get',
});

getByMonth.definition = {
    methods: ['get', 'head'],
    url: '/api/invoices/by-month/{month}',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Api\InvoiceController::getByMonth
 * @see app/Http/Controllers/Api/InvoiceController.php:19
 * @route '/api/invoices/by-month/{month}'
 */
getByMonth.url = (
    args:
        | { month: string | number }
        | [month: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { month: args };
    }

    if (Array.isArray(args)) {
        args = {
            month: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        month: args.month,
    };

    return (
        getByMonth.definition.url
            .replace('{month}', parsedArgs.month.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\Api\InvoiceController::getByMonth
 * @see app/Http/Controllers/Api/InvoiceController.php:19
 * @route '/api/invoices/by-month/{month}'
 */
getByMonth.get = (
    args:
        | { month: string | number }
        | [month: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: getByMonth.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\InvoiceController::getByMonth
 * @see app/Http/Controllers/Api/InvoiceController.php:19
 * @route '/api/invoices/by-month/{month}'
 */
getByMonth.head = (
    args:
        | { month: string | number }
        | [month: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: getByMonth.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Api\InvoiceController::getByMonth
 * @see app/Http/Controllers/Api/InvoiceController.php:19
 * @route '/api/invoices/by-month/{month}'
 */
const getByMonthForm = (
    args:
        | { month: string | number }
        | [month: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: getByMonth.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Api\InvoiceController::getByMonth
 * @see app/Http/Controllers/Api/InvoiceController.php:19
 * @route '/api/invoices/by-month/{month}'
 */
getByMonthForm.get = (
    args:
        | { month: string | number }
        | [month: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: getByMonth.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\Api\InvoiceController::getByMonth
 * @see app/Http/Controllers/Api/InvoiceController.php:19
 * @route '/api/invoices/by-month/{month}'
 */
getByMonthForm.head = (
    args:
        | { month: string | number }
        | [month: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: getByMonth.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

getByMonth.form = getByMonthForm;
/**
 * @see \App\Http\Controllers\Api\InvoiceController::update
 * @see app/Http/Controllers/Api/InvoiceController.php:56
 * @route '/api/invoices/{invoice}'
 */
export const update = (
    args:
        | { invoice: number | { id: number } }
        | [invoice: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});

update.definition = {
    methods: ['put'],
    url: '/api/invoices/{invoice}',
} satisfies RouteDefinition<['put']>;

/**
 * @see \App\Http\Controllers\Api\InvoiceController::update
 * @see app/Http/Controllers/Api/InvoiceController.php:56
 * @route '/api/invoices/{invoice}'
 */
update.url = (
    args:
        | { invoice: number | { id: number } }
        | [invoice: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { invoice: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            invoice: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        invoice:
            typeof args.invoice === 'object' ? args.invoice.id : args.invoice,
    };

    return (
        update.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\Api\InvoiceController::update
 * @see app/Http/Controllers/Api/InvoiceController.php:56
 * @route '/api/invoices/{invoice}'
 */
update.put = (
    args:
        | { invoice: number | { id: number } }
        | [invoice: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});

/**
 * @see \App\Http\Controllers\Api\InvoiceController::update
 * @see app/Http/Controllers/Api/InvoiceController.php:56
 * @route '/api/invoices/{invoice}'
 */
const updateForm = (
    args:
        | { invoice: number | { id: number } }
        | [invoice: number | { id: number }]
        | number
        | { id: number },
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
 * @see \App\Http\Controllers\Api\InvoiceController::update
 * @see app/Http/Controllers/Api/InvoiceController.php:56
 * @route '/api/invoices/{invoice}'
 */
updateForm.put = (
    args:
        | { invoice: number | { id: number } }
        | [invoice: number | { id: number }]
        | number
        | { id: number },
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

update.form = updateForm;
/**
 * @see \App\Http\Controllers\Api\InvoiceController::destroy
 * @see app/Http/Controllers/Api/InvoiceController.php:67
 * @route '/api/invoices/{invoice}'
 */
export const destroy = (
    args:
        | { invoice: number | { id: number } }
        | [invoice: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

destroy.definition = {
    methods: ['delete'],
    url: '/api/invoices/{invoice}',
} satisfies RouteDefinition<['delete']>;

/**
 * @see \App\Http\Controllers\Api\InvoiceController::destroy
 * @see app/Http/Controllers/Api/InvoiceController.php:67
 * @route '/api/invoices/{invoice}'
 */
destroy.url = (
    args:
        | { invoice: number | { id: number } }
        | [invoice: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { invoice: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            invoice: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        invoice:
            typeof args.invoice === 'object' ? args.invoice.id : args.invoice,
    };

    return (
        destroy.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\Api\InvoiceController::destroy
 * @see app/Http/Controllers/Api/InvoiceController.php:67
 * @route '/api/invoices/{invoice}'
 */
destroy.delete = (
    args:
        | { invoice: number | { id: number } }
        | [invoice: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

/**
 * @see \App\Http\Controllers\Api\InvoiceController::destroy
 * @see app/Http/Controllers/Api/InvoiceController.php:67
 * @route '/api/invoices/{invoice}'
 */
const destroyForm = (
    args:
        | { invoice: number | { id: number } }
        | [invoice: number | { id: number }]
        | number
        | { id: number },
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
 * @see \App\Http\Controllers\Api\InvoiceController::destroy
 * @see app/Http/Controllers/Api/InvoiceController.php:67
 * @route '/api/invoices/{invoice}'
 */
destroyForm.delete = (
    args:
        | { invoice: number | { id: number } }
        | [invoice: number | { id: number }]
        | number
        | { id: number },
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
const InvoiceController = { index, store, getByMonth, update, destroy };

export default InvoiceController;
