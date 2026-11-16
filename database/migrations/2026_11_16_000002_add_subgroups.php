<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Groups can have subgroups (e.g. "Big pool" → "18:00", "19:00"). A subgroup is a
 * group with a parent. Members may belong to one subgroup of their group, and
 * trainings may be recorded for one subgroup or for the whole group.
 *
 * Only new, empty, optional columns are added: existing rows are untouched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->constrained('groups');
        });

        foreach (['members', 'trainings'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('subgroup_id')->nullable()->constrained('groups');
            });
        }
    }

    public function down(): void
    {
        foreach (['members', 'trainings', 'groups'] as $tableName) {
            $column = $tableName === 'groups' ? 'parent_id' : 'subgroup_id';

            Schema::table($tableName, function (Blueprint $table) use ($column) {
                $table->dropConstrainedForeignId($column);
            });
        }
    }
};
