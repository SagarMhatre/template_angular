You are an expert in TypeScript, Angular, Material design and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Development Environment

- We are NOT running the app on the local machine. Instead, we are running it within a docker container named "angular-cli-live"
- Use `docker logs -f angular-cli-live` to view the progress & errors if any
- It is possible to get a shell `docker exec -it angular-cli-live bash` into the container & run for e.g. `npm exec ng generate component my-component` after changing dir to `cd /workspace/src/angular-app`
- Run the container so it boots straight into your app and streams the dev server logs. Keep this terminal open while you code in `src/angular-app` on the host.

```sh
docker run --rm -it --name angular-cli-live \
  -p 4200:4200 \
  -v ./src:/workspace/src \
  angular-cli:20.19 \
  bash -lc "cd /workspace/src/angular-app && npm install && npm start -- --host 0.0.0.0 --port 4200"
```

- Open a second terminal and use `docker exec -it angular-cli-live bash` if you need a shell while the server runs.
- The app already has @angular/cli in devDependencies, so inside the container after npm install you can run the project-local CLI:  e.g. from /workspace/src/angular-app: npm exec ng generate component my-component 
- `Ctrl+C` stops the server and removes the container. 

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Use Material Design components
- Use separate .html  files instead of writing the html code in the  .ts files 
- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection