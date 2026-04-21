<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Activate your account</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
    <h2>Welcome, {{ $coach->name }}!</h2>

    <p>You have been invited to join Hydra Swim Club as a coach.</p>

    <p>Click the button below to activate your account and create your password:</p>

    <p style="margin: 24px 0;">
        <a href="{{ $claimUrl }}"
           style="background: #1976d2; color: white; padding: 12px 18px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Activate My Account
        </a>
    </p>

    <p>If the button does not work, copy and paste this link into your browser:</p>

    <p>{{ $claimUrl }}</p>

    <p>This invite link will expire automatically.</p>

    <p>Hydra Swim Club</p>
</body>
</html>