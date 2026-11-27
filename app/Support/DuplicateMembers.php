<?php

namespace App\Support;

use App\Models\Member;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Finds members that are almost certainly the same child as the one being saved:
 * the same name (however it's written) and the same phone or email, the member's
 * own or the parent's. A name alone is not enough: two children can share one.
 */
class DuplicateMembers
{
    /** Macedonian Cyrillic, and Latin letters with marks, written the same way. */
    private const LETTERS = [
        'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd', 'ѓ' => 'gj', 'е' => 'e',
        'ж' => 'zh', 'з' => 'z', 'ѕ' => 'dz', 'и' => 'i', 'ј' => 'j', 'к' => 'k', 'л' => 'l',
        'љ' => 'lj', 'м' => 'm', 'н' => 'n', 'њ' => 'nj', 'о' => 'o', 'п' => 'p', 'р' => 'r',
        'с' => 's', 'т' => 't', 'ќ' => 'kj', 'у' => 'u', 'ф' => 'f', 'х' => 'h', 'ц' => 'c',
        'ч' => 'ch', 'џ' => 'dzh', 'ш' => 'sh',
        'č' => 'ch', 'ć' => 'kj', 'š' => 'sh', 'ž' => 'zh', 'đ' => 'gj', 'ǵ' => 'gj', 'ḱ' => 'kj',
    ];

    /**
     * The name in one comparable form: lower case, Latin letters, no punctuation,
     * words sorted ("Петрова Ана" and "Ana Petrova" give the same).
     */
    public static function nameKey(?string $name): string
    {
        $name = strtr(mb_strtolower(trim((string) $name)), self::LETTERS);
        $words = preg_split('/[^a-z0-9]+/', $name, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        sort($words);

        return implode(' ', $words);
    }

    /** Digits only, with +389 / 00389 written as the leading 0 (070 123 456). */
    public static function phoneKey(?string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);

        if (str_starts_with($digits, '00389')) {
            $digits = '0'.substr($digits, 5);
        } elseif (str_starts_with($digits, '389')) {
            $digits = '0'.substr($digits, 3);
        }

        return strlen($digits) >= 6 ? $digits : null;
    }

    public static function emailKey(?string $email): ?string
    {
        $email = mb_strtolower(trim((string) $email));

        return $email !== '' ? $email : null;
    }

    /**
     * The existing members that match the details being saved.
     *
     * @param  array{name: string, phone?: ?string, email?: ?string, parent_phone?: ?string, parent_email?: ?string}  $details
     * @return Collection<int, Member>
     */
    public static function find(array $details, ?int $exceptId = null): Collection
    {
        $name = self::nameKey($details['name']);
        $contacts = self::contacts($details['phone'] ?? null, $details['email'] ?? null, $details['parent_phone'] ?? null, $details['parent_email'] ?? null);

        if ($name === '' || $contacts === []) {
            return collect();
        }

        return Member::query()
            ->with(['parent', 'group', 'subgroup'])
            ->when($exceptId, fn ($query) => $query->whereKeyNot($exceptId))
            ->get()
            ->filter(fn (Member $member) => self::nameKey($member->name) === $name
                && array_intersect($contacts, self::contacts($member->phone, $member->email, $member->parent?->phone, $member->parent?->email)) !== [])
            ->values();
    }

    /**
     * What the warning shows. Someone who can't see a member (a coach, another
     * group) gets only its name and group, without the parent.
     *
     * @param  Collection<int, Member>  $members
     * @return list<array<string, mixed>>
     */
    public static function forWarning(Collection $members, User $user): array
    {
        return $members->map(function (Member $member) use ($user) {
            $canOpen = $user->canSeeMember($member);

            return [
                'id' => $member->id,
                'name' => $member->name,
                'group' => $member->group
                    ? $member->group->name.($member->subgroup ? ' · '.$member->subgroup->name : '')
                    : null,
                'status' => $member->status,
                'parent' => $canOpen ? $member->parent?->name : null,
                'canOpen' => $canOpen,
            ];
        })->all();
    }

    /** @return list<string> */
    private static function contacts(?string ...$values): array
    {
        $keys = [];

        foreach ($values as $i => $value) {
            // Phones and emails alternate: phone, email, parent phone, parent email
            $keys[] = $i % 2 === 0 ? self::phoneKey($value) : self::emailKey($value);
        }

        return array_values(array_unique(array_filter($keys)));
    }
}
