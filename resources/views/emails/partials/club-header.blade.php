{{--
    The club's logo (attached to the email, so it shows without loading images)
    and its name. No logo: just the name. $message is only there when the email
    is really sent, not in a preview.
--}}
@if (! empty($logoPath) && isset($message) && is_file($logoPath))
    <img src="{{ $message->embed($logoPath) }}" alt="{{ $clubName }}" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:50%;margin:0 0 10px;">
@endif
<p style="margin:0 0 16px;font-size:13px;color:#5b6b82;">{{ $clubName }}</p>
