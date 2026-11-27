<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * What a club may do: a free demo, a paid period, a short grace after the end,
 * then read-only. One row per club. Online payment is not part of this: when it
 * comes, it fills `provider` and `provider_ref`.
 *
 * The existing club (Hydra) is "comped": free, never expires, nothing changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->unique()->constrained()->cascadeOnDelete();
            // demo, active, comped (free for good) or suspended (by the superadmin)
            $table->string('status', 20)->default('demo');
            $table->timestamp('demo_ends_at')->nullable();
            $table->timestamp('current_period_ends_at')->nullable();
            $table->string('plan', 20)->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('provider', 30)->nullable();
            $table->string('provider_ref')->nullable();
            $table->timestamps();
        });

        foreach (DB::table('clubs')->pluck('id') as $clubId) {
            DB::table('subscriptions')->insert([
                'club_id' => $clubId,
                'status' => 'comped',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
