<?php

use App\Support\AutomaticReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
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

// Unpaid-fee reminders for clubs that send them automatically (Account settings)
Artisan::command('reminders:send', function () {
    $this->info(AutomaticReminders::sendAll().' reminder(s) sent.');
})->purpose('Send the automatic reminders for unpaid fees');

// Every morning: whoever's fee ran out gets one reminder (needs the server's cron
// to run "php artisan schedule:run" every minute)
Schedule::command('reminders:send')->dailyAt('09:00');
