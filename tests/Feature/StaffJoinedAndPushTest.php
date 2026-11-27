<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\Invitation;
use App\Models\PushSubscription;
use App\Models\User;
use App\Notifications\Channels\WebPushChannel;
use App\Notifications\StaffJoinedNotification;
use App\Support\NotificationText;
use ArrayObject;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Minishlink\WebPush\VAPID;
use Tests\TestCase;

class StaffJoinedAndPushTest extends TestCase
{
    use RefreshDatabase;

    private function inviteAndAccept(User $inviter, string $role = 'coach'): User
    {
        $this->actingAs($inviter)->post('/staff/invitations', [
            'name' => 'Marko', 'email' => 'marko@example.com', 'role' => $role, 'all_groups' => true,
        ])->assertSessionHasNoErrors();
        $invitation = Invitation::latest('id')->firstOrFail();
        auth()->logout();

        $this->post("/invitation/{$invitation->token}", [
            'password' => 'secret-pass', 'password_confirmation' => 'secret-pass',
        ])->assertRedirect('/dashboard');

        return User::where('email', 'marko@example.com')->firstOrFail();
    }

    public function test_the_inviting_admin_and_the_owner_are_told_when_someone_joins()
    {
        Mail::fake();
        Notification::fake();
        $owner = User::factory()->create(['role' => 'admin']);
        Club::current()->forceFill(['owner_id' => $owner->id])->save();
        $admin = User::factory()->create(['role' => 'admin']);
        $otherAdmin = User::factory()->create(['role' => 'admin']);

        $this->inviteAndAccept($admin);

        Notification::assertSentTo([$admin, $owner], StaffJoinedNotification::class,
            fn ($notification) => $notification->url === '/staff');
        Notification::assertNotSentTo($otherAdmin, StaffJoinedNotification::class);
    }

    public function test_the_owner_who_invited_is_told_once_and_a_deactivated_inviter_not_at_all()
    {
        Mail::fake();
        Notification::fake();
        $owner = User::factory()->create(['role' => 'admin']);
        Club::current()->forceFill(['owner_id' => $owner->id])->save();

        $this->inviteAndAccept($owner);
        Notification::assertSentToTimes($owner, StaffJoinedNotification::class, 1);

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post('/staff/invitations', [
            'name' => 'Ana', 'email' => 'ana@example.com', 'role' => 'admin',
        ])->assertSessionHasNoErrors();
        $admin->forceFill(['deactivated_at' => now()])->save();
        $invitation = Invitation::latest('id')->firstOrFail();
        auth()->logout();
        $this->post("/invitation/{$invitation->token}", [
            'password' => 'secret-pass', 'password_confirmation' => 'secret-pass',
        ]);

        Notification::assertNotSentTo($admin, StaffJoinedNotification::class);
        Notification::assertSentToTimes($owner, StaffJoinedNotification::class, 2);
    }

    public function test_the_bell_shows_who_joined_in_the_readers_language()
    {
        Mail::fake();
        $owner = User::factory()->create(['role' => 'admin']);
        Club::current()->forceFill(['owner_id' => $owner->id])->save();

        $this->inviteAndAccept($owner);
        auth()->logout();

        $this->actingAs($owner)->withCookie('locale', 'mk')->get('/notifications')
            ->assertInertia(fn (Assert $page) => $page
                ->where('items.0.message', 'Marko ја прифати поканата и се приклучи во тимот како тренер.')
                ->where('items.0.type', 'staff_joined')
                ->where('items.0.url', '/staff'));
    }

    public function test_every_notification_also_goes_out_as_a_push()
    {
        $notification = new StaffJoinedNotification('x', '/staff');
        $user = User::factory()->create(['role' => 'admin']);

        $this->assertContains(WebPushChannel::class, $notification->via($user));
    }

    public function test_a_device_turns_push_on_and_off_and_belongs_to_whoever_turned_it_on_last()
    {
        $ana = User::factory()->create(['role' => 'admin']);
        $marko = User::factory()->create(['role' => 'coach']);
        $device = [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/abc123',
            'keys' => ['p256dh' => 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', 'auth' => 'tBHItJI5svbpez7KI4CCXg'],
        ];

        $this->actingAs($ana)->postJson('/push-subscriptions', $device)->assertNoContent();
        $this->actingAs($marko)->postJson('/push-subscriptions', $device)->assertNoContent();

        $this->assertSame(1, PushSubscription::count());
        $this->assertSame($marko->id, PushSubscription::first()->user_id);

        // Someone else can't turn off Marko's device
        $this->actingAs($ana)->deleteJson('/push-subscriptions', ['endpoint' => $device['endpoint']])->assertNoContent();
        $this->assertSame(1, PushSubscription::count());

        $this->actingAs($marko)->deleteJson('/push-subscriptions', ['endpoint' => $device['endpoint']])->assertNoContent();
        $this->assertSame(0, PushSubscription::count());
    }

    public function test_only_secure_push_addresses_are_accepted_and_guests_cannot_subscribe()
    {
        $this->postJson('/push-subscriptions', [])->assertUnauthorized();

        $this->actingAs(User::factory()->create(['role' => 'coach']))->postJson('/push-subscriptions', [
            'endpoint' => 'http://example.com/push',
            'keys' => ['p256dh' => 'x', 'auth' => 'y'],
        ])->assertJsonValidationErrors('endpoint');
    }

    public function test_tapping_a_push_marks_it_read_and_opens_its_page()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $user->notify(new StaffJoinedNotification('Marko joined', '/staff'));
        $notification = $user->notifications()->firstOrFail();

        $this->actingAs($user)->get("/notifications/{$notification->id}/open")->assertRedirect('/staff');
        $this->assertNotNull($notification->fresh()->read_at);

        $other = User::factory()->create(['role' => 'admin']);
        $this->actingAs($other)->get("/notifications/{$notification->id}/open")->assertNotFound();
    }

    /**
     * A device with real keys, push keys on the server, and a fake push service
     * that answers "201 Created". Returns the requests the fake service got.
     */
    private function fakePushService(User $user, string $locale = 'mk'): ArrayObject
    {
        $key = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);

        if ($key === false) {
            $this->markTestSkipped('This PHP cannot make EC keys (on Windows set OPENSSL_CONF).');
        }

        $vapid = VAPID::createVapidKeys();
        config([
            'services.webpush.public_key' => $vapid['publicKey'],
            'services.webpush.private_key' => $vapid['privateKey'],
            'services.webpush.subject' => 'https://hydraswimming.mk',
        ]);

        $details = openssl_pkey_get_details($key)['ec'];
        $b64 = fn (string $bytes) => rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
        $endpoint = 'https://fcm.googleapis.com/fcm/send/device-1';
        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => $endpoint,
            'endpoint_hash' => PushSubscription::hash($endpoint),
            'public_key' => $b64("\x04".str_pad($details['x'], 32, "\0", STR_PAD_LEFT).str_pad($details['y'], 32, "\0", STR_PAD_LEFT)),
            'auth_token' => $b64(random_bytes(16)),
            'locale' => $locale,
        ]);

        $requests = new ArrayObject;
        $stack = HandlerStack::create(new MockHandler(array_fill(0, 5, new Response(201))));
        $stack->push(Middleware::history($requests));
        WebPushChannel::$httpClient = new Client(['handler' => $stack]);

        return $requests;
    }

    protected function tearDown(): void
    {
        WebPushChannel::$httpClient = null;
        parent::tearDown();
    }

    public function test_a_notification_really_goes_out_as_a_push_to_the_device()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $requests = $this->fakePushService($admin, 'mk');
        app()->setLocale('en');

        $admin->notify(new StaffJoinedNotification('Marko joined', '/staff', NotificationText::make(
            ':name accepted the invitation and joined the team as :role.', ['name' => 'Marko', 'role' => 'coach'],
        )));

        $this->assertCount(1, $requests);
        $request = $requests[0]['request'];
        $this->assertSame('https://fcm.googleapis.com/fcm/send/device-1', (string) $request->getUri());
        $this->assertSame('aes128gcm', $request->getHeaderLine('Content-Encoding'));
        $this->assertStringStartsWith('vapid ', $request->getHeaderLine('Authorization'));
        // The app's own language is back after wording the push in Macedonian
        $this->assertSame('en', app()->getLocale());
    }

    public function test_without_push_keys_nothing_is_sent_and_nothing_breaks()
    {
        config(['services.webpush.public_key' => null, 'services.webpush.private_key' => null]);
        $user = User::factory()->create(['role' => 'admin']);
        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/abc',
            'endpoint_hash' => PushSubscription::hash('https://fcm.googleapis.com/fcm/send/abc'),
            'public_key' => 'x', 'auth_token' => 'y',
        ]);

        $user->notify(new StaffJoinedNotification('Marko joined', '/staff'));

        $this->assertSame(1, $user->notifications()->count());
        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('pushKey', null));
    }
}
