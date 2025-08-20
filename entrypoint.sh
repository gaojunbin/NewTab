#!/bin/bash

# Fix permissions for volume mounted files
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html

# Start Apache in foreground
exec /usr/sbin/httpd -D FOREGROUND