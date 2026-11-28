<?php

namespace App\Http\Controllers;

use App\Mail\PaymentConfirmationMail;
use App\Models\Club;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\User;
use App\Notifications\MembershipPaymentNotification;
use App\Support\ClubRule;
use App\Support\NotificationText;
use App\Support\PaymentReminderMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Throwable;

class MembershipFeeController extends Controller
{
    public function index(Request $request)
    {
        $members = Member::visibleTo(Auth::user())->get(['id', 'name', 'group_id', 'status']);

        return inertia('membership-fees/index', [
            'members' => $members,
            // The payment history (it grows every month) follows right after the page,
            // so the pop-up opens at once; a placeholder shows until it arrives
            // The "Add payment" quick action shows only the form: no history then
            'allFees' => $request->boolean('add') ? null : Inertia::defer(fn () => MembershipFee::query()
                ->with(['member:id,name', 'group:id,name'])
                // Coaches see the payments of members in their groups
                ->when(
                    Auth::user()->visibleGroupIds() !== null,
                    fn ($query) => $query->whereHas('member', fn ($member) => $member->visibleTo(Auth::user())),
                )
                ->orderBy('start_date', 'desc')
                ->get(['id', 'member_id', 'member_name', 'group_id', 'amount', 'payment_method', 'start_date', 'end_date'])),
            'userRole' => Auth::user()->role,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'member_id' => [
                'required',
                ClubRule::exists('members')->where('status', 'active'),
                // Coaches record payments only for members of their groups
                function ($attribute, $value, $fail) {
                    if (! ($member = Member::find($value)) || ! Auth::user()->canSeeMember($member)) {
                        $fail(__('This member is not in one of your groups.'));
                    }
                },
            ],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:cash,card'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);

        $member = Member::findOrFail($validated['member_id']);

        $fee = MembershipFee::create([
            ...$validated,
            'member_name' => $member->name,
            'group_id' => $member->group_id,
        ]);

        if (Auth::user()?->role === 'coach' && $member) {
            $admins = User::inCurrentClub('admin')->active()->get();

            foreach ($admins as $admin) {
                // Opening it shows the confirmation email for this payment, ready to send
                $admin->notify(new MembershipPaymentNotification(
                    Auth::user()->name.' recorded a payment for '.$member->name.'. Tap to send the confirmation email.',
                    '/membership-fees?member='.$member->id.'&history=1&confirm='.$fee->id,
                    NotificationText::make(':user recorded a payment for :member. Tap to send the confirmation email.', [
                        'user' => Auth::user()->name,
                        'member' => $member->name,
                    ]),
                ));
            }
        }

        // The "payment saved" pop-up: the summary, and where a confirmation would go
        $address = PaymentReminderMessage::addressOf($member->load('parent'));
        $club = Club::current();
        $autoSent = false;

        // The club sends confirmations by itself: right away, to the same address
        if ($address && $club->payment_confirmation_emails && $club->auto_payment_confirmation) {
            try {
                Mail::to($address[0])->send(new PaymentConfirmationMail($fee, $club));
                $fee->forceFill(['confirmation_sent_at' => now()])->save();
                $autoSent = true;
            } catch (Throwable $e) {
                // Not sent: the pop-up offers to send it by hand instead
                report($e);
            }
        }

        return back()
            ->with('success', 'Payment recorded!')
            ->with('fee_saved', [
                'id' => $fee->id,
                'member_id' => $member->id,
                'member' => $member->name,
                'amount' => (float) $fee->amount,
                'payment_method' => $fee->payment_method,
                'start_date' => $fee->start_date?->toDateString(),
                'end_date' => $fee->end_date?->toDateString(),
                'email' => $address[0] ?? null,
                'email_of' => $address[1] ?? null,
                'auto_sent' => $autoSent,
            ]);
    }

    /**
     * Sends the "payment received" email for one payment: to the parent, else the
     * member. Only admins send emails to parents (the route is admins-only), also
     * for payments a coach recorded.
     */
    public function sendConfirmation(MembershipFee $membershipFee)
    {
        $member = $membershipFee->member;
        abort_unless($member && ! $member->trashed(), 404);

        // The club switched these emails off (Club settings)
        if (! Club::current()->payment_confirmation_emails) {
            throw ValidationException::withMessages([
                'confirmation' => __('Payment confirmations by email are switched off in the club settings.'),
            ]);
        }

        $address = PaymentReminderMessage::addressOf($member->load('parent'));

        if (! $address) {
            throw ValidationException::withMessages(['confirmation' => __('No email saved')]);
        }

        try {
            Mail::to($address[0])->send(new PaymentConfirmationMail($membershipFee, Club::current()));
        } catch (Throwable $e) {
            report($e);

            throw ValidationException::withMessages(['confirmation' => __('The email could not be sent. Try again later.')]);
        }

        $membershipFee->forceFill(['confirmation_sent_at' => now()])->save();

        return back()->with('success', 'Confirmation sent.');
    }

    /**
     * The confirmation email exactly as it will be sent, shown before sending:
     * to whom, the subject and the text (admins only).
     */
    public function confirmationPreview(MembershipFee $membershipFee)
    {
        $member = $membershipFee->member;
        abort_unless($member && ! $member->trashed(), 404);

        $address = PaymentReminderMessage::addressOf($member->load('parent'));

        // No email yet: the page offers to enter one (member's and/or parent's) first
        if (! $address) {
            return response()->json([
                'no_email' => true,
                'member_id' => $member->id,
                'member' => $member->name,
                'errors' => ['confirmation' => [__('No email saved')]],
            ], 422);
        }

        $from = $membershipFee->start_date?->format('d.m.Y');
        $to = $membershipFee->end_date?->format('d.m.Y');

        return response()->json([
            'email' => $address[0],
            'source' => $address[1],
            'recipient_name' => $address[1] === 'parent' ? $member->parent?->name : $member->name,
            'member' => $member->name,
            'subject' => __('Payment confirmation – :name', ['name' => $member->name]),
            'greeting' => __('Dear Sir or Madam,'),
            'thanks' => __('Thank you for the membership fee payment for :name.', ['name' => $member->name]),
            'amount' => __('Amount').': '.number_format((float) $membershipFee->amount, 0, ',', ' ').' MKD',
            'period' => __('This payment covers the period from :from to :to.', ['from' => $from, 'to' => $to]),
            'signature' => __('Kind regards,')."\n".Club::current()->name,
            'already_sent' => $membershipFee->confirmation_sent_at?->toIso8601String(),
        ]);
    }

    /** Deletes a payment entered by mistake (admins only; the page asks first). */
    public function destroy(MembershipFee $membershipFee)
    {
        $membershipFee->delete();

        return back()->with('success', 'Payment deleted.');
    }

    public function update(Request $request, MembershipFee $membershipFee)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:cash,card'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);

        $membershipFee->update($validated);

        return back()->with('success', 'Payment updated!');
    }

    public function getByMember(Member $member)
    {
        abort_unless(Auth::user()->canSeeMember($member), 403);

        $fees = MembershipFee::where('member_id', $member->id)
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json(['fees' => $fees]);
    }
}
