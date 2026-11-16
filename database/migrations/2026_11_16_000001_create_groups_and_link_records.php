<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Club-made groups replace the fixed Big/Small pools.
 *
 * Nothing is deleted: the two existing pools become the groups "Big pool" and
 * "Small pool", every member, training, membership fee and invoice is linked to
 * the matching group, and the old `pool` columns stay (unused) so this release
 * can be undone. A later release can drop them.
 */
return new class extends Migration
{
    private const LINKED_TABLES = ['members', 'trainings', 'membership_fees', 'invoices'];

    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60);
            $table->unsignedInteger('position')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });

        $now = now();
        $big = DB::table('groups')->insertGetId(['name' => 'Big pool', 'position' => 1, 'created_at' => $now, 'updated_at' => $now]);
        $small = DB::table('groups')->insertGetId(['name' => 'Small pool', 'position' => 2, 'created_at' => $now, 'updated_at' => $now]);

        foreach (self::LINKED_TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('group_id')->nullable()->constrained('groups');
            });

            DB::table($tableName)->where('pool', 'big')->update(['group_id' => $big]);
            DB::table($tableName)->where('pool', 'small')->update(['group_id' => $small]);
        }

        // Invoices: one per month per pool becomes one per month per group (checked in
        // the app, since an invoice may now have no group at all)
        if (Schema::hasIndex('invoices', ['month', 'pool'], 'unique')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropUnique(['month', 'pool']);
            });
        }

        // Invoices may now have no group, so their `pool` must become optional.
        // Only invoices are altered: changing a column on members or trainings can
        // rebuild the table on some databases (SQLite), which would cascade-delete
        // the fees and attendance pointing at them. Their `pool` keeps its default
        // and is simply no longer used.
        Schema::table('invoices', function (Blueprint $table) {
            $table->enum('pool', ['big', 'small'])->nullable()->change();
        });
    }

    public function down(): void
    {
        // New rows never fill `pool`, so the old rule cannot clash with them
        if (! Schema::hasIndex('invoices', ['month', 'pool'], 'unique')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->unique(['month', 'pool']);
            });
        }

        foreach (self::LINKED_TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('group_id');
            });
        }

        Schema::dropIfExists('groups');
    }
};
