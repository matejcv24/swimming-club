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
                        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">{!! nl2br(e($paragraph)) !!}</p>
                    @endforeach
                @else
                    @foreach ($body as $paragraph)
                        @if (is_array($paragraph))
                            <ul style="margin:0 0 14px;padding-left:20px;font-size:15px;line-height:1.6;">
                                @foreach ($paragraph as $line)
                                    <li>{{ $line }}</li>
                                @endforeach
                            </ul>
                        @else
                            <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">{!! nl2br(e($paragraph)) !!}</p>
                        @endif
                    @endforeach
                @endif

                {{-- The attendance and payments page, in its own highlighted box --}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;background:#eef6fb;border:2px solid #c5dceb;border-radius:14px;">
                    <tr>
                        <td style="padding:16px 18px;">
                            <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#001031;">{{ __('Attendance and payments') }}</p>
                            <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#3b4a60;">{{ __('See all payments and training attendance') }}</p>
                            <a href="{{ $familyLink }}" style="display:block;background:#0c76a8;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;text-align:center;padding:13px 18px;border-radius:999px;">{{ __('Open the page') }} &rarr;</a>
                            <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#5b6b82;text-align:center;">
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
