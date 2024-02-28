FROM denoland/deno

WORKDIR /app

ADD . /app

RUN deno cache main.ts

CMD ["run", "--allow-net", "--allow-read", "--allow-env", "--unstable-cron", "main.ts"]