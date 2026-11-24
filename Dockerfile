# jbh-web: the built app served by Caddy.
# CI runs `ng build --configuration production` first, so this image only copies www/.
FROM caddy:2-alpine

# One layer with three jobs, all for running without root (Kubernetes "restricted" Pod Security):
# - setcap -r: the official caddy binary carries the file capability cap_net_bind_service (to bind ports
#   below 1024). We listen on 8080, so it is not needed. With it, a container that drops ALL capabilities
#   cannot even start the binary ("operation not permitted"). libcap is added only for setcap, then removed.
# - a fixed numeric user and group (10001): Kubernetes "runAsNonRoot" can only check a number.
# - Caddy's folders (/config, /data) belong to that user, so Caddy can write there when nothing is mounted.
#   Compose and Kubernetes mount empty writable folders there anyway (tmpfs / emptyDir).
RUN apk add --no-cache libcap \
    && setcap -r /usr/bin/caddy \
    && apk del libcap \
    && addgroup -S -g 10001 jbh \
    && adduser -S -u 10001 -G jbh jbh \
    && chown -R 10001:10001 /config /data

COPY --chown=10001:10001 deploy/Caddyfile /etc/caddy/Caddyfile
COPY --chown=10001:10001 www/ /srv/

USER 10001:10001
EXPOSE 8080
