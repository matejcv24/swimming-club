<?php

namespace App\Support;

use App\Mail\PaymentReminderMail;
use App\Models\Club;
use App\Models\Member;
use App\Models\PaymentReminder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Reminders that go out by themselves (Account settings → "Send reminders
 * automatically"): once a day, one email per family to everyone whose fee has
 * run out, once for each time it runs out. Someone already reminded since their
 * fee ended (by hand or automatically) gets nothing more.
 */
class AutomaticReminders
{
    /** Sends for every club that wants it; returns how many emails went out. */
    public static function sendAll(): int
    {
        return Club::query()
            ->where('payment_reminder_emails', true)
            ->where('auto_payment_reminder', true)
            ->get()
            ->sum(fn (Club $club) => CurrentClub::runFor($club, fn () => self::sendFor($club)));
    }

    public static function sendFor(Club $club): int
    {
        $previousLocale = App::getLocale();
        App::setLocale($club->locale ?: config('app.locale'));

        try {
            $today = Carbon::today();
            $late = Member::query()
                ->where('status', 'active')
                ->with('parent:id,name,phone,email')
                ->withMax('membershipFees', 'end_date')
                ->orderBy('name')
                ->get()
                ->filter(function (Member $member) use ($today) {
                    $end = $member->membership_fees_max_end_date;

                    return ! $end || Carbon::parse($end)->lt($today);
                })
                ->values();

            $sent = 0;
            $done = [];

            foreach ($late as $member) {
                if (in_array($member->id, $done, true)) {
                    continue;
                }

                $reminder = PaymentReminderMessage::for($member, $late);

                if (! $reminder) {
                    continue;
                }

                // One email per family: brothers and sisters are in the same one
                $done = [...$done, ...$reminder->members->pluck('id')->all()];

                if (self::alreadyReminded($reminder)) {
                    continue;
                }

                try {
                    Mail::to($reminder->email)->send(new PaymentReminderMail($reminder, $club));
                } catch (Throwable $e) {
                    report($e);

                    continue;
                }

                foreach ($reminder->members as $lateMember) {
                    PaymentReminder::create([
                        'member_id' => $lateMember->id,
                        'email' => $reminder->email,
                        'sent_by' => null,
                        'sent_at' => now(),
                    ]);
                }

                $sent++;
            }

            return $sent;
        } finally {
            App::setLocale($previousLocale);
        }
    }

    /** A reminder already went out after the fee (of the one who is late longest) ran out. */
    private static function alreadyReminded(PaymentReminderMessage $reminder): bool
    {
        if (! $reminder->lastSentAt) {
            return false;
        }

        $latestEnd = $reminder->members
            ->map(fn (Member $member) => PaymentReminderMessage::expiredOn($member))
            ->filter()
            ->max();

        // Never paid: one reminder is enough
        return ! $latestEnd || $reminder->lastSentAt->gt($latestEnd);
    }
}
