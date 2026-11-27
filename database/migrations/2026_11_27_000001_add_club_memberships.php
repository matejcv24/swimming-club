<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Multi-club, step 1: who a person is (users) is kept apart from where they work
 * and as what (club memberships), so one person can be in several clubs.
 *
 * Every existing account becomes a member of the existing club with exactly the
 * role, groups, settings and active/deleted state it has today. The old columns on
 * `users` stay (unused) until a later clean-up, so rolling back loses nothing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            // The club's address name (hydra.<domain>), unique and never reused
            $table->string('slug', 40)->nullable()->unique()->after('name');
            $table->string('status', 20)->default('active')->after('slug');
            $table->string('sport', 30)->nullable()->after('status');
            $table->string('sport_other', 60)->nullable()->after('sport');
            // A club's own domain (Hydra: hydraswimming.mk)
            $table->string('custom_domain')->nullable()->unique()->after('sport_other');
            $table->string('locale', 5)->default('mk')->after('custom_domain');
            $table->timestamp('email_verified_at')->nullable()->after('email');
        });

        Schema::create('club_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20)->default('coach');
            $table->boolean('all_groups')->default(true);
            $table->json('notification_settings')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();
            // Removed from this club's team; their data in the club stays
            $table->softDeletes();
            $table->unique(['club_id', 'user_id']);
            $table->index(['user_id', 'deleted_at']);
        });

        $clubs = DB::table('clubs')->orderBy('id')->get();

        foreach ($clubs as $i => $club) {
            DB::table('clubs')->where('id', $club->id)->update([
                'slug' => $this->slugFor($club->name, $i),
            ]);
        }

        $club = $clubs->first();

        if (! $club) {
            return;
        }

        // The existing club: swimming, and its current web address as its own domain
        $host = parse_url((string) config('app.url'), PHP_URL_HOST);
        DB::table('clubs')->where('id', $club->id)->update([
            'sport' => 'swimming',
            'custom_domain' => $host && ! in_array($host, ['localhost', '127.0.0.1'], true) && ! str_ends_with($host, '.test')
                ? $host
                : null,
        ]);

        // Every account, deleted ones too, keeps its role and state in that club
        DB::table('users')->orderBy('id')->each(function (object $user) use ($club) {
            DB::table('club_user')->insert([
                'club_id' => $club->id,
                'user_id' => $user->id,
                'role' => $user->role ?? 'coach',
                'all_groups' => $user->all_groups ?? true,
                'notification_settings' => $user->notification_settings ?? null,
                'deactivated_at' => $user->deactivated_at ?? null,
                'created_at' => $user->created_at ?? now(),
                'updated_at' => now(),
                'deleted_at' => $user->deleted_at ?? null,
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('club_user');

        Schema::table('clubs', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropUnique(['custom_domain']);
            $table->dropColumn(['slug', 'status', 'sport', 'sport_other', 'custom_domain', 'locale', 'email_verified_at']);
        });
    }

    private function slugFor(string $name, int $i): string
    {
        $slug = str_contains(mb_strtolower($name), 'hydra') ? 'hydra' : Str::slug(Str::ascii($name));

        return ($slug !== '' ? $slug : 'club').($i > 0 ? '-'.($i + 1) : '');
    }
};
