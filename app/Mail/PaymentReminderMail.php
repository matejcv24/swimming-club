<?php

namespace App\Mail;

use App\Http\Controllers\FamilyController;
use App\Models\Club;
use App\Support\PaymentReminderMessage;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Facades\Storage;

/**
 * "Membership fee reminder": the fixed text (or the admin's edited version), the
 * club's logo, and a link to the members' attendance and payments. Sent in the
 * club's name; replies go to the club's email.
 */
class PaymentReminderMail extends Mailable
{
    public function __construct(
        public PaymentReminderMessage $reminder,
        public Club $club,
        /** The text as the admin edited it (null: the fixed text) */
        public ?string $customText = null,
        /** The subject as the admin edited it (null: the fixed one) */
        public ?string $customSubject = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address((string) config('mail.from.address'), $this->club->name),
            replyTo: $this->club->email ? [new Address($this->club->email, $this->club->name)] : [],
            subject: $this->customSubject ?? $this->reminder->subject($this->club),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-reminder',
            with: [
                'clubName' => $this->club->name,
                'logoPath' => $this->club->logo_path ? Storage::disk('local')->path($this->club->logo_path) : null,
                'paragraphs' => $this->reminder->paragraphs($this->club),
                'customText' => $this->customText,
                'familyLink' => FamilyController::link($this->reminder->members->pluck('id')->all()),
                'linkDays' => FamilyController::VALID_DAYS,
            ],
        );
    }
}
