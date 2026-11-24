<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The club's owner (an admin other admins can't deactivate or change), and
     * invitations: staff join through an emailed link and set their own password.
     */
    public function up(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->foreignId('owner_id')->nullable()->after('logo_path')->constrained('users')->nullOnDelete();
        });

        // The club's first admin becomes its owner
        $owner = DB::table('users')->where('role', 'admin')->whereNull('deactivated_at')->orderBy('id')->value('id');

        if ($owner) {
            DB::table('clubs')->update(['owner_id' => $owner]);
        }

        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('role', 20);
            $table->boolean('all_groups')->default(false);
            $table->json('group_ids')->nullable();
            // The link's secret: looked up by its hash, kept encrypted so the admin
            // can copy the link again
            $table->char('token_hash', 64)->unique();
            $table->text('token');
            $table->foreignId('invited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at');
            $table->timestamp('email_sent_at')->nullable();
            $table->timestamp('email_failed_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');

        Schema::table('clubs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_id');
        });
    }
};
