<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Coaches work with one, several or all of the club's groups, and only see,
 * add and edit members, trainings and payments of those groups.
 *
 * Existing coaches keep seeing every group (all_groups defaults to true), so
 * nothing changes for them until an admin assigns their groups.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('all_groups')->default(true);
        });

        Schema::create('coach_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_groups');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('all_groups');
        });
    }
};
