<?php

namespace App\Support;

use App\Models\Club;
use App\Models\Member;
use App\Models\PaymentReminder;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * One payment reminder: who it goes to, which late members it names (brothers and
 * sisters with the same parent email get one email together) and its fixed text.
 * The preview in the app and the email itself are both made from this.
 */
class PaymentReminderMessage
{
    /**
     * @param  Collection<int, Member>  $members  late members it is about
     */
    private function __construct(
        public readonly string $email,
        public readonly ?string $recipientName,
        /** 'parent' or 'member': whose email it is */
        public readonly string $source,
        public readonly Collection $members,
        public readonly ?Carbon $lastSentAt,
    ) {}

    /**
     * Where a member's reminders go: the parent's email, else the member's own.
     *
     * @return array{0: string, 1: string}|null [email, 'parent'|'member']
     */
    public static function addressOf(Member $member): ?array
    {
        if (filled($member->parent?->email)) {
            return [trim($member->parent->email), 'parent'];
        }

        if (filled($member->email)) {
            return [trim($member->email), 'member'];
        }

        return null;
    }

    /**
     * The reminder for a late member, together with every other late member whose
     * reminders go to the same address. Null when there is no address.
     *
     * @param  Collection<int, Member>  $lateMembers  all members late with payment
     */
    public static function for(Member $member, Collection $lateMembers): ?self
    {
        $address = self::addressOf($member);

        if (! $address) {
            return null;
        }

        [$email, $source] = $address;
        $key = mb_strtolower($email);

        $members = $lateMembers
            ->filter(fn (Member $late) => mb_strtolower((string) (self::addressOf($late)[0] ?? '')) === $key)
            ->sortBy('name')
            ->values();

        // The member asked about is late too, even if the list missed them
        if (! $members->contains('id', $member->id)) {
            $members->push($member);
        }

        $recipientName = $source === 'parent'
            ? (filled($member->parent?->name) ? $member->parent->name : null)
            : $member->name;

        $lastSentAt = PaymentReminder::whereIn('member_id', $members->pluck('id'))->max('sent_at');

        return new self($email, $recipientName, $source, $members, $lastSentAt ? Carbon::parse($lastSentAt) : null);
    }

    /** The last day of a member's last paid period (null: never paid). */
    public static function expiredOn(Member $member): ?Carbon
    {
        $end = $member->membership_fees_max_end_date ?? null;

        return $end ? Carbon::parse($end) : null;
    }

    /** The day after a member's last paid period ended (null: never paid). */
    public static function unpaidFrom(Member $member): ?Carbon
    {
        $end = $member->membership_fees_max_end_date ?? null;

        return $end ? Carbon::parse($end)->addDay() : null;
    }

    public function subject(Club $club): string
    {
        return __('Membership fee reminder – :club – :date', ['club' => $club->name, 'date' => now()->format('d.m.Y')]);
    }

    /**
     * The fixed text, paragraph by paragraph (a list paragraph is an array).
     *
     * @return list<string|list<string>>
     */
    public function paragraphs(Club $club): array
    {
        $expired = fn (Member $member) => ($end = self::expiredOn($member))
            ? __('expired on :date', ['date' => $end->format('d.m.Y')])
            : __('no payment on record');

        if ($this->members->count() === 1) {
            $member = $this->members->first();
            $end = self::expiredOn($member);

            $body = [$end
                ? __('We remind you that the membership fee for :member expired on :date.', ['member' => $member->name, 'date' => $end->format('d.m.Y')])
                : __('We remind you that there is no membership fee payment on record for :member.', ['member' => $member->name])];
        } else {
            $body = [
                __('We remind you that the membership fee has expired for:'),
                $this->members->map(fn (Member $member) => $member->name.' – '.$expired($member))->all(),
            ];
        }

        return [
            __('Dear Sir or Madam,'),
            ...$body,
            __('We would be grateful if you could make the payment as soon as possible. If you have already paid, please ignore this message.'),
            __('Kind regards,')."\n".$club->name,
        ];
    }

    /**
     * The same text as plain text, for editing in the preview: paragraphs apart by
     * an empty line, list lines starting with "•".
     */
    public function text(Club $club): string
    {
        return collect($this->paragraphs($club))
            ->map(fn ($paragraph) => is_array($paragraph)
                ? implode("\n", array_map(fn ($line) => '• '.$line, $paragraph))
                : $paragraph)
            ->implode("\n\n");
    }

    /** For the preview pop-up. */
    public function toArray(Club $club): array
    {
        return [
            'email' => $this->email,
            'recipient_name' => $this->recipientName,
            'source' => $this->source,
            'members' => $this->members->map(fn (Member $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'unpaid_from' => self::unpaidFrom($member)?->toDateString(),
                'expired_on' => self::expiredOn($member)?->toDateString(),
            ])->values(),
            'subject' => $this->subject($club),
            'paragraphs' => $this->paragraphs($club),
            'text' => $this->text($club),
            'last_sent_at' => $this->lastSentAt?->toIso8601String(),
        ];
    }
}
