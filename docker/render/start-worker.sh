#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

php artisan config:cache

exec php artisan queue:work --verbose --tries=1 --timeout=90
