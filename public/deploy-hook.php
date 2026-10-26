<?php

/**
 * Post-deploy hook, called by GitHub Actions (.github/workflows/deploy.yml).
 *
 * The cPanel account has no shell, so this file installs new releases and runs
 * the artisan commands a deploy needs. It only accepts POST requests carrying
 * the X-Deploy-Token header that matches DEPLOY_HOOK_TOKEN in the server's .env.
 *
 *   action=down     put the site in maintenance mode
 *   action=install  download the release zip from GitHub (url + sha256) and
 *                   unpack it over the app, never touching .env or storage/
 *   action=up       migrate, rebuild caches and bring the site back up
 *   action=live     only bring the site back up (used when a deploy fails)
 */

header('Content-Type: text/plain; charset=utf-8');

const RELEASE_URL_PREFIX = 'https://github.com/matejcv24/swimming-club/releases/download/';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit("Method not allowed\n");
}

$basePath = dirname(__DIR__);

// Read the token straight from .env so neither a config cache nor vendor/ is needed
$envContents = is_file($basePath.'/.env') ? (string) file_get_contents($basePath.'/.env') : '';
$expectedToken = preg_match('/^DEPLOY_HOOK_TOKEN=["\']?([^"\'\r\n]*)/m', $envContents, $match) ? trim($match[1]) : '';
$givenToken = (string) ($_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? '');

if (strlen($expectedToken) < 32 || ! hash_equals($expectedToken, $givenToken)) {
    http_response_code(403);
    exit("Forbidden\n");
}

$action = (string) ($_POST['action'] ?? '');

set_time_limit(300);
ignore_user_abort(true);

function fail(string $message): never
{
    http_response_code(500);
    exit($message."\nDEPLOY HOOK FAILED\n");
}

/** Paths a release must never overwrite or delete. */
function isProtectedPath(string $path): bool
{
    $path = ltrim(str_replace('\\', '/', $path), '/');

    return $path === ''
        || str_contains($path, '..')
        || preg_match('#^(\.env|\.htaccess|\.user\.ini|php\.ini|\.well-known/|cgi-bin/|storage/)#', $path) === 1;
}

if ($action === 'install') {
    $url = (string) ($_POST['url'] ?? '');
    $sha256 = strtolower((string) ($_POST['sha256'] ?? ''));

    if (! str_starts_with($url, RELEASE_URL_PREFIX) || ! preg_match('/^[a-f0-9]{64}$/', $sha256)) {
        http_response_code(400);
        exit("Invalid release url or checksum\n");
    }

    if (! class_exists(ZipArchive::class)) {
        fail('The PHP zip extension is not enabled on this server.');
    }

    $workDir = $basePath.'/storage/app/deploy';
    if (! is_dir($workDir) && ! mkdir($workDir, 0755, true)) {
        fail("Cannot create {$workDir}");
    }

    $zipPath = $workDir.'/release.zip';
    echo ">>> download {$url}\n";

    $handle = fopen($zipPath, 'wb');
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_FILE => $handle,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_FAILONERROR => true,
        CURLOPT_CONNECTTIMEOUT => 30,
        CURLOPT_TIMEOUT => 240,
    ]);
    $downloaded = curl_exec($curl);
    $curlError = curl_error($curl);
    curl_close($curl);
    fclose($handle);

    if (! $downloaded) {
        fail("Download failed: {$curlError}");
    }

    if (! hash_equals($sha256, hash_file('sha256', $zipPath))) {
        fail('Checksum mismatch, refusing to install.');
    }

    echo 'OK ('.round(filesize($zipPath) / 1048576, 1)." MB, checksum verified)\n\n";

    $zip = new ZipArchive;
    if ($zip->open($zipPath) !== true) {
        fail('Cannot open the release zip.');
    }

    $files = [];
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $name = $zip->getNameIndex($i);
        if (! isProtectedPath($name)) {
            $files[] = $name;
        }
    }

    echo '>>> unpack '.count($files)." entries\n";
    if (! $zip->extractTo($basePath, $files)) {
        $zip->close();
        fail('Unpacking failed.');
    }
    $zip->close();
    echo "OK\n\n";

    // Remove files that were deployed last time but are no longer in the release
    $manifestPath = $workDir.'/manifest.json';
    $newFiles = array_values(array_filter($files, fn ($name) => ! str_ends_with($name, '/')));
    $oldFiles = is_file($manifestPath) ? (array) json_decode((string) file_get_contents($manifestPath), true) : [];
    $removed = 0;

    foreach (array_diff($oldFiles, $newFiles) as $stale) {
        $stalePath = $basePath.'/'.$stale;
        if (! isProtectedPath($stale) && is_file($stalePath) && unlink($stalePath)) {
            $removed++;
        }
    }

    file_put_contents($manifestPath, json_encode($newFiles));
    unlink($zipPath);
    echo ">>> removed {$removed} stale files\nOK\n\n";

    if (function_exists('opcache_reset')) {
        opcache_reset();
    }

    exit("DONE\n");
}

$steps = match ($action) {
    'down' => [['down', ['--retry' => 60]]],
    'up' => [
        ['optimize:clear', []],
        ['migrate', ['--force' => true]],
        ['optimize', []],
    ],
    'live' => [],
    default => null,
};

if ($steps === null) {
    http_response_code(400);
    exit("Unknown action\n");
}

require $basePath.'/vendor/autoload.php';

$app = require $basePath.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$failed = false;

foreach ($steps as [$command, $parameters]) {
    echo ">>> php artisan {$command}\n";

    try {
        $status = $kernel->call($command, $parameters);
        echo $kernel->output();
    } catch (Throwable $e) {
        $status = 1;
        echo get_class($e).': '.$e->getMessage()."\n";
    }

    echo $status === 0 ? "OK\n\n" : "FAILED (exit {$status})\n\n";

    if ($status !== 0) {
        $failed = true;
        break;
    }
}

// Never leave the site in maintenance mode after an up/live call, even if a step failed
if (in_array($action, ['up', 'live'], true)) {
    echo ">>> php artisan up\n";
    $kernel->call('up');
    echo $kernel->output()."\n";
}

if ($failed) {
    fail('');
}

echo "DONE\n";
