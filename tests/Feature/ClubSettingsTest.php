<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ClubSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        // The club the migrations made, without the logo it copied
        Club::query()->update(['name' => 'SC Hydra', 'email' => null, 'logo_path' => null]);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_every_page_gets_the_clubs_name_email_and_logo_state()
    {
        $this->actingAs($this->admin())->get('/dashboard')
            ->assertInertia(fn ($page) => $page
                ->where('club.name', 'SC Hydra')
                ->where('club.email', null)
                ->where('club.logo_url', null));
    }

    public function test_an_admin_saves_the_clubs_name_and_email()
    {
        $this->actingAs($this->admin())
            ->post('/club', ['name' => '  ПК Водник ', 'email' => 'info@vodnik.mk'])
            ->assertSessionHasNoErrors();

        $club = Club::current();
        $this->assertSame('ПК Водник', $club->name);
        $this->assertSame('info@vodnik.mk', $club->email);
    }

    public function test_name_and_email_are_required_and_the_email_must_be_valid()
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post('/club', ['name' => '', 'email' => 'info@vodnik.mk'])->assertSessionHasErrors('name');
        $this->actingAs($admin)->post('/club', ['name' => 'Club', 'email' => ''])->assertSessionHasErrors('email');
        $this->actingAs($admin)->post('/club', ['name' => 'Club', 'email' => 'not-an-email'])->assertSessionHasErrors('email');

        $this->assertSame('SC Hydra', Club::current()->name);
    }

    public function test_coaches_cannot_change_the_club()
    {
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($coach)->post('/club', ['name' => 'Mine', 'email' => 'me@example.com'])->assertForbidden();

        $this->assertSame('SC Hydra', Club::current()->name);
    }

    public function test_a_logo_is_stored_as_a_small_png_and_shown_to_everyone_logged_in()
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post('/club', [
            'name' => 'Club', 'email' => 'info@club.mk',
            'logo' => UploadedFile::fake()->image('logo.jpg', 1200, 800),
        ])->assertSessionHasNoErrors();

        $club = Club::current();
        Storage::disk('local')->assertExists($club->logo_path);

        [$width, $height] = getimagesizefromstring(Storage::disk('local')->get($club->logo_path));
        $this->assertLessThanOrEqual(256, max($width, $height));

        $coach = User::factory()->create(['role' => 'coach']);
        $this->actingAs($coach)->get('/club/logo')->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->actingAs($coach)->get('/dashboard')->assertInertia(fn ($page) => $page->where('club.logo_url', $club->logoUrl()));
    }

    public function test_only_png_jpg_and_webp_pictures_up_to_2_mb_are_accepted()
    {
        $admin = $this->admin();
        $base = ['name' => 'Club', 'email' => 'info@club.mk'];

        $svg = UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
        $this->actingAs($admin)->post('/club', [...$base, 'logo' => $svg])->assertSessionHasErrors('logo');

        $text = UploadedFile::fake()->createWithContent('logo.png', 'this is not a picture');
        $this->actingAs($admin)->post('/club', [...$base, 'logo' => $text])->assertSessionHasErrors('logo');

        $big = UploadedFile::fake()->image('logo.png')->size(3000);
        $this->actingAs($admin)->post('/club', [...$base, 'logo' => $big])->assertSessionHasErrors('logo');

        $this->assertNull(Club::current()->logo_path);
    }

    public function test_the_logo_can_be_removed()
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post('/club', [
            'name' => 'Club', 'email' => 'info@club.mk', 'logo' => UploadedFile::fake()->image('logo.png', 100, 100),
        ]);
        $path = Club::current()->logo_path;

        $this->actingAs($admin)->delete('/club/logo')->assertSessionHasNoErrors();

        $this->assertNull(Club::current()->logo_path);
        Storage::disk('local')->assertMissing($path);
        $this->actingAs($admin)->get('/club/logo')->assertNotFound();
    }

    public function test_only_admins_can_delete_the_logo()
    {
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($coach)->delete('/club/logo')->assertForbidden();
    }

    public function test_the_login_page_shows_the_clubs_name_and_logo_but_not_its_email()
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post('/club', [
            'name' => 'Club', 'email' => 'info@club.mk', 'logo' => UploadedFile::fake()->image('logo.png', 100, 100),
        ]);
        auth()->logout();

        $this->get('/login')->assertInertia(fn ($page) => $page
            ->where('club.name', 'Club')
            ->where('club.email', null)
            ->where('club.logo_url', Club::current()->logoUrl()));
        $this->get('/club/logo')->assertOk();
    }
}
