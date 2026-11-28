<?php

namespace App\Http\Controllers;

use App\Mail\PaymentReminderMail;
use App\Models\Club;
use App\Models\ClubParent;
use App\Models\Member;
use App\Models\PaymentReminder;
use App\Support\PaymentReminderMessage;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class UnpaidFeeController extends Controller
{
    public function index()
    {
        $lateMembers = $this->lateMembers();

        // When each one last got a reminder
        $lastReminders = PaymentReminder::whereIn('member_id', $lateMembers->pluck('id'))
            ->selectRaw('member_id, max(sent_at) as last_sent_at')
            ->groupBy('member_id')
            ->pluck('last_sent_at', 'member_id');

        $unpaidMembers = $lateMembers->map(fn (Member $member) => [
            'id' => $member->id,
            'name' => $member->name,
            'group_id' => $member->group_id,
            'parentName' => $member->parent?->name,
            'phone' => $member->parent?->phone,
            // Shown when there are no parent details to call instead
            'memberPhone' => $member->phone,
            // Where a reminder goes (none: no email saved)
            'reminder_email' => PaymentReminderMessage::addressOf($member)[0] ?? null,
            'last_reminder_at' => isset($lastReminders[$member->id]) ? Carbon::parse($lastReminders[$member->id])->toIso8601String() : null,
            'latest_end_date' => $member->membership_fees_max_end_date
                ? Carbon::parse($member->membership_fees_max_end_date)->toDateString()
                : null,
        ])->values();

        // One list; the page splits it into the club's groups
        return inertia('unpaid-fees/index', [
            'unpaidMembers' => $unpaidMembers,
        ]);
    }

    /**
     * The missing email, entered from the unpaid list: the member's own, the
     * parent's (a parent is added if the member has none), or both. One is enough.
     */
    public function saveEmail(Request $request, Member $member)
    {
        $validated = $request->validate([
            'member_email' => ['nullable', 'required_without:parent_email', 'email', 'max:255'],
            'parent_email' => ['nullable', 'required_without:member_email', 'email', 'max:255'],
        ], [
            'member_email.required_without' => __('Enter at least one email.'),
            'parent_email.required_without' => __('Enter at least one email.'),
        ]);

        $clean = fn (?string $email) => filled($email) ? mb_strtolower(trim($email)) : null;

        if ($email = $clean($validated['member_email'] ?? null)) {
            $member->update(['email' => $email]);
        }

        if ($email = $clean($validated['parent_email'] ?? null)) {
            if ($member->parent) {
                $member->parent->update(['email' => $email]);
            } else {
                $parent = ClubParent::create(['name' => '', 'email' => $email]);
                $member->update(['parent_id' => $parent->id]);
            }
        }

        return back()->with('success', 'Email saved.');
    }

    /** What the reminder for this member would say, and to whom (the preview). */
    public function preview(Member $member)
    {
        $reminder = $this->reminderFor($member);

        return response()->json($reminder->toArray(Club::current()));
    }

    /**
     * Emails the reminder: one email for every late member with the same address
     * (brothers and sisters), each of them marked as reminded.
     */
    public function send(Request $request, Member $member)
    {
        // The admin may have changed the text in the preview
        $validated = $request->validate([
            'text' => ['nullable', 'string', 'max:5000'],
            'subject' => ['nullable', 'string', 'max:200'],
        ]);

        $club = Club::current();

        // The club switched these emails off (Club settings)
        if (! $club->payment_reminder_emails) {
            throw ValidationException::withMessages([
                'reminder' => __('Reminders by email are switched off in the club settings.'),
            ]);
        }

        $reminder = $this->reminderFor($member);
        $text = trim((string) ($validated['text'] ?? ''));
        $customText = $text !== '' && $text !== $reminder->text($club) ? $text : null;
        $subject = trim((string) ($validated['subject'] ?? ''));
        $customSubject = $subject !== '' && $subject !== $reminder->subject($club) ? $subject : null;

        try {
            Mail::to($reminder->email)->send(new PaymentReminderMail($reminder, $club, $customText, $customSubject));
        } catch (Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'reminder' => __('The email could not be sent. Try again later.'),
            ]);
        }

        foreach ($reminder->members as $late) {
            PaymentReminder::create([
                'member_id' => $late->id,
                'email' => $reminder->email,
                'sent_by' => Auth::id(),
                'sent_at' => now(),
            ]);
        }

        return back()->with('success', 'Reminder sent!');
    }

    /** The reminder for a member who is late and has an email to send it to. */
    private function reminderFor(Member $member): PaymentReminderMessage
    {
        $lateMembers = $this->lateMembers();
        $late = $lateMembers->firstWhere('id', $member->id);

        abort_unless($late, 404);

        $reminder = PaymentReminderMessage::for($late, $lateMembers);

        if (! $reminder) {
            throw ValidationException::withMessages([
                'reminder' => __('There is no email saved for this member or their parent.'),
            ]);
        }

        return $reminder;
    }

    /**
     * Active members whose latest fee has ended (or who never paid), each with the
     * end date of their latest fee.
     *
     * @return Collection<int, Member>
     */
    private function lateMembers(): Collection
    {
        $today = Carbon::today();

        return Member::visibleTo(Auth::user())
            ->where('status', 'active')
            ->with('parent:id,name,phone,email')
            ->withMax('membershipFees', 'end_date')
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'email', 'group_id', 'parent_id'])
            ->filter(function (Member $member) use ($today) {
                $latestEnd = $member->membership_fees_max_end_date;

                return ! $latestEnd || Carbon::parse($latestEnd)->lt($today);
            })
            ->values();
    }
}
