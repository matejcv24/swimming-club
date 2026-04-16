<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CoachInvite extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $coach,
        public string $inviteUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You have been invited to Swimming Club as a Coach',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.coach-invite',
            with: [
                'inviteUrl'  => $this->inviteUrl,
                'coachName'  => $this->coach->name,
            ],
        );
    }
}