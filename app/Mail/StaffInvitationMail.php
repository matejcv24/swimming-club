<?php

namespace App\Mail;

use App\Models\Club;
use App\Models\Invitation;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Facades\Storage;

/**
 * "Marko invited you to SC Hydra as a coach": the link where the invited person
 * sets their password. Sent in the club's name; replies go to the club's email.
 */
class StaffInvitationMail extends Mailable
{
    public function __construct(
        public Invitation $invitation,
        public Club $club,
        public string $inviterName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address((string) config('mail.from.address'), $this->club->name),
            replyTo: $this->club->email ? [new Address($this->club->email, $this->club->name)] : [],
            subject: __(':name invited you to :club', ['name' => $this->inviterName, 'club' => $this->club->name]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.staff-invitation',
            with: [
                'name' => $this->invitation->name,
                'inviterName' => $this->inviterName,
                'clubName' => $this->club->name,
                'logoPath' => $this->club->logo_path ? Storage::disk('local')->path($this->club->logo_path) : null,
                'role' => $this->invitation->role === 'admin' ? __('an admin') : __('a coach'),
                'link' => $this->invitation->link(),
                'days' => Invitation::VALID_DAYS,
            ],
        );
    }
}
