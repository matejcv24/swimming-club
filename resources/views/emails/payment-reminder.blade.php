<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $clubName }}</title>
</head>
<body style="margin:0;padding:24px;background:#f2f6fa;font-family:Arial,Helvetica,sans-serif;color:#001031;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;">
        <tr>
            <td style="padding:28px;">
                @include('emails.partials.club-header')

                @php
                    // The fixed text's signature goes under the attendance box
                    $body = $customText === null ? array_slice($paragraphs, 0, -1) : null;
                    $signature = $customText === null ? end($paragraphs) : null;
                @endphp

                @if ($customText !== null)
                    {{-- The text as the admin edited it: plain text, paragraph by paragraph --}}
                    @foreach (preg_split('/\R{2,}/', trim($customText)) as $paragraph)
                        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">{!! $reminder->emphasize($paragraph) !!}</p>
                    @endforeach
                @else
                    @foreach ($body as $paragraph)
                        @if (is_array($paragraph))
                            <ul style="margin:0 0 14px;padding-left:20px;font-size:15px;line-height:1.6;">
                                @foreach ($paragraph as $line)
                                    <li>{!! $reminder->emphasize($line) !!}</li>
                                @endforeach
                            </ul>
                        @else
                            <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">{!! $reminder->emphasize($paragraph) !!}</p>
                        @endif
                    @endforeach
                @endif

                {{-- The attendance and payments page, in its own box --}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;background:#f5f8fb;border:1px solid #dbe5ee;border-radius:12px;">
                    <tr>
                        <td style="padding:16px 18px;">
                            <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#0b2545;">{{ __('Attendance and payments') }}</p>
                            <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#3b4a60;">{{ __('See all payments and training attendance') }}</p>
                            {{-- A "bulletproof" button: a table cell, so every email app draws it the same --}}
                            <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
                                <tr>
                                    <td bgcolor="#0b2545" style="background:#0b2545;border-radius:8px;">
                                        <a href="{{ $familyLink }}" style="display:inline-block;padding:11px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;line-height:18px;color:#ffffff;text-decoration:none;white-space:nowrap;letter-spacing:0.2px;">
                                            @if (isset($message) && is_file($iconPath))
                                                <img src="{{ $message->embed($iconPath) }}" alt="" width="18" height="18" style="display:inline-block;width:18px;height:18px;vertical-align:-3px;margin-right:8px;border:0;">
                                            @endif{{ __('Open the page') }}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#6b7a90;">
                                {{ trans_choice('The link works for :count day.|The link works for :count days.', $linkDays, ['count' => $linkDays]) }}
                            </p>
                        </td>
                    </tr>
                </table>

                @if ($signature !== null)
                    <p style="margin:0;font-size:15px;line-height:1.6;">{!! nl2br(e($signature)) !!}</p>
                @endif

                @include('emails.partials.unique-ending')
            </td>
        </tr>
    </table>
</body>
</html>
