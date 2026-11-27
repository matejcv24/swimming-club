<?php

namespace App\Models;

use App\Models\Concerns\BelongsToClub;
use Illuminate\Notifications\DatabaseNotification;

/**
 * A bell notification of one club: someone working in two clubs sees each
 * club's notifications only while working in that club.
 */
class ClubNotification extends DatabaseNotification
{
    use BelongsToClub;
}
