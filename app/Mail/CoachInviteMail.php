<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CoachInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $coach;
    public string $claimUrl;

    public function __construct(User $coach, string $claimUrl)
    {
        $this->coach = $coach;
        $this->claimUrl = $claimUrl;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Activate your Hydra coach account',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.coach-invite',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}