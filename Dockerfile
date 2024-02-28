FROM denoland/deno:1.41.0

WORKDIR /app

COPY main.ts /app
COPY deno.lock /app

RUN deno cache main.ts

CMD ["run", "--allow-net", "--allow-read", "--allow-env", "--unstable-cron", "main.ts"]