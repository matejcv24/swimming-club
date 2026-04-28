#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

php artisan migrate --force
php artisan storage:link || true
php artisan config:cache
php artisan view:cache

exec apache2-foreground
