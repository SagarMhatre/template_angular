# Angular Dev Container Instructions

- Base image definition lives at `Dockerfile` (Node 20.19.0, no global Angular CLI; use the project-local CLI via npm).
- Host source mount target: `/Users/sagarmhatre/Local-Documents/src/templates/angular/src` → container path `/workspace/src`.

## One-time build

```sh
# From repo root: build the Angular CLI image
docker build -t angular-cli:20.19 .
```

## Start container with mount and port

```sh
# Launch container in the background with port 4200 exposed
docker run -d --name angular-cli-dev \
  -p 4200:4200 \
  -v ./src:/workspace/src \
  angular-cli:20.19 \
  tail -f /dev/null
```

## Create an Angular app (inside container)

```sh
# Open a shell in the container
docker exec -it angular-cli-dev bash

# Inside the container
cd /workspace/src
npx -y @angular/cli@21 new angular-app --skip-git --package-manager npm --defaults
cd angular-app
```

- The project will also appear on the host at `/Users/sagarmhatre/Local-Documents/src/templates/angular/src/angular-app`.

## Run the dev server

```sh
# Inside the container, from /workspace/src/angular-app
npm start -- --host 0.0.0.0 --port 4200
```

- Open `http://localhost:4200/` on the host to view the app.

## Stop and clean up

```sh
# Stop and remove the container
docker rm -f angular-cli-dev
```

## Run as a developer's container

- Run the container so it boots straight into your app and streams the dev server logs. Keep this terminal open while you code in `src/angular-app` on the host.

```sh
docker run --rm -it --name angular-cli-live \
  -p 4200:4200 \
  -v ./src:/workspace/src \
  angular-cli:20.19 \
  bash -lc "cd /workspace/src/angular-app && npm install && npm start -- --host 0.0.0.0 --port 4200"
```

- `Ctrl+C` stops the server and removes the container. Open a second terminal and use `docker exec -it angular-cli-live bash` if you need a shell while the server runs.
