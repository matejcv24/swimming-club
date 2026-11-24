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

                @if ($customText !== null)
                    {{-- The text as the admin edited it: plain text, paragraph by paragraph --}}
                    @foreach (preg_split('/\R{2,}/', trim($customText)) as $paragraph)
                        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">{!! nl2br(e($paragraph)) !!}</p>
                    @endforeach
                @else
                    @foreach ($paragraphs as $paragraph)
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

                <p style="margin:22px 0 8px;">
                    <a href="{{ $familyLink }}" style="display:inline-block;background:#0c76a8;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:999px;">{{ __('View attendance and payments') }}</a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#5b6b82;">
                    {{ trans_choice('The link works for :count day.|The link works for :count days.', $linkDays, ['count' => $linkDays]) }}
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
