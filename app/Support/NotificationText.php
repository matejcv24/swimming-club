<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Support\Str;

/**
 * A notification's text in the reader's language. New notifications keep what
 * happened ("text": a sentence with placeholders and the values), so they are
 * worded when shown; older ones only have the English sentence ("message").
 */
class NotificationText
{
    /**
     * @param  array<string, mixed>  $data  the notification's stored data
     */
    public static function of(array $data): string
    {
        $text = $data['text'] ?? null;

        if (! is_array($text) || ! isset($text['key'])) {
            return (string) ($data['message'] ?? '');
        }

        $params = (array) ($text['params'] ?? []);

        // What a coach changed on a member: "name, group" in the reader's language
        if (isset($params['changes']) && is_array($params['changes'])) {
            $params['changes'] = implode(', ', array_map(fn ($change) => __($change), $params['changes']));
        }

        // The salary's month, e.g. "November 2026" / "Ноември 2026"
        if (isset($params['month'])) {
            $params['month'] = Str::ucfirst(Carbon::parse($params['month'])->locale(app()->getLocale())->translatedFormat('F Y'));
        }

        // A staff role ("coach" / "admin"), in the reader's language and lower case
        if (isset($params['role'])) {
            $params['role'] = mb_strtolower(__(Str::ucfirst((string) $params['role'])));
        }

        return __($text['key'], $params);
    }

    /**
     * What to store for a new notification: the sentence (English, with
     * placeholders) and its values.
     *
     * @param  array<string, mixed>  $params
     * @return array{key: string, params: array<string, mixed>}
     */
    public static function make(string $key, array $params = []): array
    {
        return ['key' => $key, 'params' => $params];
    }
}
