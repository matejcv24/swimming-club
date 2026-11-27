<?php

namespace App\Mail;

use App\Http\Controllers\FamilyController;
use App\Models\Club;
use App\Models\MembershipFee;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Facades\Storage;

/**
 * "Payment received": thanks for the membership fee, the amount and the period it
 * covers, and the same link to the member's attendance and payments as the
 * reminder. Sent in the club's name; replies go to the club's email.
 */
class PaymentConfirmationMail extends Mailable
{
    public function __construct(
        public MembershipFee $fee,
        public Club $club,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address((string) config('mail.from.address'), $this->club->name),
            replyTo: $this->club->email ? [new Address($this->club->email, $this->club->name)] : [],
            subject: __('Payment confirmation – :name', ['name' => $this->fee->member?->name ?? $this->fee->member_name]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-confirmation',
            with: [
                'clubName' => $this->club->name,
                'logoPath' => $this->club->logo_path ? Storage::disk('local')->path($this->club->logo_path) : null,
                'memberName' => $this->fee->member?->name ?? $this->fee->member_name,
                'amount' => number_format((float) $this->fee->amount, 0, ',', ' '),
                'from' => $this->fee->start_date?->format('d.m.Y'),
                'to' => $this->fee->end_date?->format('d.m.Y'),
                'familyLink' => FamilyController::link([$this->fee->member_id]),
                'iconUrl' => rtrim(config('app.url'), '/').'/images/email-calendar.png',
                'linkDays' => FamilyController::VALID_DAYS,
            ],
        );
    }
}
