<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Minishlink\WebPush\VAPID;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// New keys for push notifications: copy the three lines into .env (once per server)
Artisan::command('push:keys', function () {
    $keys = VAPID::createVapidKeys();

    $this->line('VAPID_PUBLIC_KEY='.$keys['publicKey']);
    $this->line('VAPID_PRIVATE_KEY='.$keys['privateKey']);
    $this->line('VAPID_SUBJECT='.config('app.url'));
})->purpose('Create the keys for push notifications');
