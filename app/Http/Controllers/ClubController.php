<?php

namespace App\Http\Controllers;

use App\Models\Club;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ClubController extends Controller
{
    /** The logo is kept at most this many pixels wide or tall. */
    private const LOGO_SIZE = 256;

    /**
     * The club's logo, from storage that can't run scripts. Shown to everyone: also
     * on the login and invitation pages.
     */
    public function logo()
    {
        $club = Club::current();

        abort_unless($club->logo_path && Storage::disk('local')->exists($club->logo_path), 404);

        return Storage::disk('local')->response($club->logo_path, null, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            // Images only (no SVG: it can carry scripts)
            'logo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        $club = Club::current();
        $club->name = trim($validated['name']);
        $club->email = trim($validated['email']);

        if ($request->hasFile('logo')) {
            $this->replaceLogo($club, $request->file('logo'));
        }

        $club->save();

        return back()->with('success', 'Club settings saved!');
    }

    /** Deletes the logo (the page asks "are you sure?" first). */
    public function destroyLogo()
    {
        $club = Club::current();

        if ($club->logo_path) {
            Storage::disk('local')->delete($club->logo_path);
            $club->update(['logo_path' => null]);
        }

        return back()->with('success', 'Logo removed!');
    }

    /**
     * Stores the logo as a fresh PNG of limited size, drawn again from the picture
     * itself: whatever else the uploaded file held (scripts, metadata) is dropped.
     */
    private function replaceLogo(Club $club, UploadedFile $file): void
    {
        $source = function_exists('imagecreatefromstring')
            ? @imagecreatefromstring((string) file_get_contents($file->getRealPath()))
            : false;

        if ($source === false) {
            throw ValidationException::withMessages(['logo' => __('This picture could not be read. Try another one.')]);
        }

        [$width, $height] = [imagesx($source), imagesy($source)];
        $scale = min(1, self::LOGO_SIZE / max($width, $height));
        $target = imagecreatetruecolor(max(1, (int) round($width * $scale)), max(1, (int) round($height * $scale)));

        // Keep transparent backgrounds
        imagealphablending($target, false);
        imagesavealpha($target, true);
        imagefill($target, 0, 0, imagecolorallocatealpha($target, 0, 0, 0, 127));
        imagecopyresampled($target, $source, 0, 0, 0, 0, imagesx($target), imagesy($target), $width, $height);

        ob_start();
        imagepng($target);
        $png = (string) ob_get_clean();

        $path = "clubs/{$club->id}/logo.png";
        Storage::disk('local')->put($path, $png);
        $club->logo_path = $path;
    }
}
