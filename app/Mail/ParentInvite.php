<?php

namespace App\Mail;

use App\Models\ClubParent;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ParentInvite extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ClubParent $clubParent,
        public string $inviteUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You have been invited to Swimming Club',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.parent-invite',
            with: [
                'inviteUrl' => $this->inviteUrl,
                'parentName' => $this->clubParent->name,
            ],
        );
    }
}