#!/bin/sh
domain="$1"
base="$2"

config=$(sed "s/%domain%/$domain/g" < "$base"data/site-template.conf)
echo "config:"
echo "$config"
echo -e "$config" > "/usr/local/etc/nginx/sites-enabled/$domain.conf"