<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    /**
     * The club's own details (name, email, logo), changed from the pop-up opened by
     * the club name in the top bar. One club for now: SC Hydra, keeping its logo.
     */
    public function up(): void
    {
        Schema::create('clubs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Required in the form; empty only until the club's admins fill it in
            $table->string('email')->nullable();
            $table->string('logo_path')->nullable();
            $table->timestamps();
        });

        // The server's app name, unless it's still the framework's default
        $name = trim((string) config('app.name'));

        $id = DB::table('clubs')->insertGetId([
            'name' => $name === '' || $name === 'Laravel' ? 'SC Hydra' : $name,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Hydra keeps the logo the top bar showed until now
        $logo = public_path('images/hydra-mark.png');

        if (is_file($logo)) {
            $path = "clubs/{$id}/logo.png";
            Storage::disk('local')->put($path, file_get_contents($logo));
            DB::table('clubs')->where('id', $id)->update(['logo_path' => $path]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('clubs');
    }
};
