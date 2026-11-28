/** The club's own details, shared with every page of a logged-in person. */
export type ClubSharedData = {
    name: string;
    /** Empty until the club's admins fill it in. */
    email: string | null;
    /** Where the logo is shown from (changes when it is replaced); none: initials. */
    logo_url: string | null;
    /** The club sends "payment received" emails (Club settings). */
    payment_confirmation_emails: boolean;
    /** The club sends reminders for unpaid fees (Club settings). */
    payment_reminder_emails: boolean;
};
