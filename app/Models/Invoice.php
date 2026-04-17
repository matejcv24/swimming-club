<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = ['month', 'pool', 'amount'];
    protected $casts = [
        'month' => 'date:Y-m-d',
        'amount' => 'decimal:2',
    ];
}
