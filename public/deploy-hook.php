<?php

/**
 * Post-deploy hook, called by GitHub Actions (.github/workflows/deploy.yml).
 *
 * The cPanel account has no shell, so this runs the artisan commands a deploy
 * needs. It only accepts POST requests carrying the X-Deploy-Token header that
 * matches DEPLOY_HOOK_TOKEN in the server's .env file.
 *
 *   action=down  put the site in maintenance mode before files are uploaded
 *   action=up    migrate, rebuild caches and bring the site back up
 *   action=live  only bring the site back up (used when a deploy fails)
 */

header('Content-Type: text/plain; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit("Method not allowed\n");
}

$basePath = dirname(__DIR__);

require $basePath.'/vendor/autoload.php';

// Read the token straight from .env so a stale config cache can never lock us out
$env = is_file($basePath.'/.env') ? Dotenv\Dotenv::parse((string) file_get_contents($basePath.'/.env')) : [];
$expectedToken = (string) ($env['DEPLOY_HOOK_TOKEN'] ?? '');
$givenToken = (string) ($_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? '');

if (strlen($expectedToken) < 32 || ! hash_equals($expectedToken, $givenToken)) {
    http_response_code(403);
    exit("Forbidden\n");
}

$steps = match ($_POST['action'] ?? '') {
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

set_time_limit(300);
ignore_user_abort(true);

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
if (in_array($_POST['action'], ['up', 'live'], true)) {
    echo ">>> php artisan up\n";
    $kernel->call('up');
    echo $kernel->output()."\n";
}

if ($failed) {
    http_response_code(500);
    exit("DEPLOY HOOK FAILED\n");
}

echo "DONE\n";
