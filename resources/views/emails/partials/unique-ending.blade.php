{{--
    A hidden, different-every-time ending. Gmail folds the part of an email that is
    identical to earlier ones behind "…"; with this nothing at the end repeats, so
    the button and the signature always show. Readers never see it.
--}}
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;opacity:0;">{{ \Illuminate\Support\Str::uuid() }}</div>
