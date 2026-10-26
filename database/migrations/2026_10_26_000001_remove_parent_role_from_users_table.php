<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $parentIds = DB::table('users')->where('role', 'parent')->pluck('id');

        DB::table('notifications')
            ->where('notifiable_type', 'App\\Models\\User')
            ->whereIn('notifiable_id', $parentIds)
            ->delete();

        DB::table('users')->whereIn('id', $parentIds)->delete();

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('coach')->change(); // admin, coach
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('parent')->change();
        });
    }
};
