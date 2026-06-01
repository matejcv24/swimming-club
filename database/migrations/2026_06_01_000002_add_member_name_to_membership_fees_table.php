<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('membership_fees', function (Blueprint $table) {
            $table->string('member_name')->nullable()->after('member_id');
        });

        DB::table('membership_fees')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('members')
                    ->whereColumn('members.id', 'membership_fees.member_id');
            })
            ->update([
                'member_name' => DB::raw('(select members.name from members where members.id = membership_fees.member_id)'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('membership_fees', function (Blueprint $table) {
            $table->dropColumn('member_name');
        });
    }
};
