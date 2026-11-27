<?php

namespace App\Models\Concerns;

use App\Models\Club;
use App\Support\CurrentClub;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * A record that belongs to one club.
 *
 * - Every query sees only the current club's rows, so a page, a pop-up or a URL
 *   with another club's id (it answers "not found") can never reach them.
 * - Fail closed: with no current club, queries find nothing (and stop with an
 *   error outside production, so the mistake is seen), never "all clubs".
 * - A new row gets the current club; saving a row of another club is refused.
 *
 * Code that really needs every club (the superadmin) must say so with
 * withoutGlobalScope('club').
 */
trait BelongsToClub
{
    public static function bootBelongsToClub(): void
    {
        static::addGlobalScope('club', function (Builder $query) {
            $clubId = CurrentClub::id();

            if ($clubId === null) {
                if (! app()->isProduction()) {
                    throw new LogicException('No current club for a '.class_basename($query->getModel()).' query.');
                }

                $query->whereRaw('1 = 0');

                return;
            }

            $query->where($query->getModel()->qualifyColumn('club_id'), $clubId);
        });

        // "saving" comes before "creating", so a new row gets its club here
        static::saving(function ($model) {
            $clubId = CurrentClub::id() ?? throw new LogicException('No current club to save a '.class_basename($model).' in.');

            $model->club_id ??= $clubId;

            if ((int) $model->club_id !== $clubId) {
                throw new LogicException('A '.class_basename($model).' of another club cannot be saved here.');
            }
        });

        static::deleting(function ($model) {
            if ((int) $model->club_id !== CurrentClub::id()) {
                throw new LogicException('A '.class_basename($model).' of another club cannot be deleted here.');
            }
        });
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }
}
