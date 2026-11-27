<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>{{ $clubName }}</title>
    {{-- Phone mail apps: don't turn links blue or resize the text --}}
    <style>
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
        body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        .hydra-button a { color: #ffffff !important; text-decoration: none !important; }
    </style>
</head>
<body style="margin:0;padding:24px;background:#f2f6fa;font-family:Arial,Helvetica,sans-serif;color:#001031;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;">
        <tr>
            <td style="padding:28px;">
                @include('emails.partials.club-header')

                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">{{ __('Dear Sir or Madam,') }}</p>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">{!! __('Thank you for the membership fee payment for :name.', ['name' => '<strong>'.e($memberName).'</strong>']) !!}</p>

                {{-- What was paid, in a green box --}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#ecfdf3;border:1px solid #b7ebc9;border-radius:12px;">
                    <tr>
                        <td style="padding:14px 18px;font-size:15px;line-height:1.7;color:#14532d;">
                            {{ __('Amount') }}: <strong>{{ $amount }} MKD</strong><br>
                            {{ __('This payment covers the period from :from to :to.', ['from' => $from, 'to' => $to]) }}
                        </td>
                    </tr>
                </table>

                {{-- The attendance and payments page, the same as in the reminder --}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#f5f8fb;border:1px solid #dbe5ee;border-radius:12px;">
                    <tr>
                        <td style="padding:16px 18px;">
                            <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#0b2545;">{{ __('Attendance and payments') }}</p>
                            <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#3b4a60;">{{ __('See all payments and training attendance') }}</p>
                            <table role="presentation" class="hydra-button" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
                                <tr>
                                    <td bgcolor="#0f2b5b" style="background-color:#0f2b5b;border-radius:8px;padding:0;">
                                        <a href="{{ $familyLink }}" target="_blank" style="display:block;padding:11px 20px;background-color:#0f2b5b;border:1px solid #0f2b5b;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;line-height:18px;color:#ffffff;text-decoration:none;white-space:nowrap;letter-spacing:0.2px;">
                                            <img src="{{ $iconUrl }}" alt="" width="18" height="18" style="display:inline-block;width:18px;height:18px;vertical-align:-3px;margin-right:8px;border:0;outline:none;"><span style="color:#ffffff;text-decoration:none;">{{ __('Open the page') }}</span>
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

                <p style="margin:0;font-size:15px;line-height:1.6;">{{ __('Kind regards,') }}<br>{{ $clubName }}</p>

                @include('emails.partials.unique-ending')
            </td>
        </tr>
    </table>
</body>
</html>
