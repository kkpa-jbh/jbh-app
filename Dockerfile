# jbh-web: the built app served by Caddy.
# CI runs `ng build --configuration production` first, so this image only copies www/.
FROM caddy:2-alpine

COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY www/ /srv/

EXPOSE 8080
