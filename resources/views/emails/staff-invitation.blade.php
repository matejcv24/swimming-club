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
            <td style="padding:28px 28px 8px;">
                @include('emails.partials.club-header')
                <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;">{{ __('Hello :name,', ['name' => $name]) }}</h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.5;">
                    {{ __(':inviter invited you to :club as :role.', ['inviter' => $inviterName, 'club' => $clubName, 'role' => $role]) }}
                    {{ __('Set your password to start using the app.') }}
                </p>
                <p style="margin:0 0 24px;">
                    <a href="{{ $link }}" style="display:inline-block;background:#0c76a8;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:999px;">{{ __('Accept the invitation') }}</a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#5b6b82;">
                    {{ trans_choice('The link works for :count day.|The link works for :count days.', $days, ['count' => $days]) }}
                    {{ __("If the button doesn't work, copy this address into your browser:") }}
                </p>
                <p style="margin:0 0 24px;font-size:12px;word-break:break-all;color:#0c76a8;">{{ $link }}</p>
                @include('emails.partials.unique-ending')
            </td>
        </tr>
    </table>
</body>
</html>
