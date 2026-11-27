<?php

namespace App\Support;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Illuminate\Validation\Rules\Unique;

/**
 * Validation rules that look up records, limited to the current club. A plain
 * "exists" would accept another club's id in a crafted request; these don't.
 */
class ClubRule
{
    public static function exists(string $table, string $column = 'id'): Exists
    {
        return Rule::exists($table, $column)->where('club_id', CurrentClub::id());
    }

    public static function unique(string $table, string $column = 'NULL'): Unique
    {
        return Rule::unique($table, $column)->where('club_id', CurrentClub::id());
    }
}
