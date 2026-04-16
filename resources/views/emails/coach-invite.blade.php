@component('mail::message')
# Welcome to Swimming Club!

Hi {{ $coachName }},

You have been invited to join the Swimming Club app as a **Coach**.

Click the button below to set your password and activate your account:

@component('mail::button', ['url' => $inviteUrl])
Activate My Account
@endcomponent

This link will expire in **72 hours**.

If you did not expect this email, you can ignore it.

Thanks,
Swimming Club
@endcomponent