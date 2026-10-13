## ADDED Requirements

### Requirement: Page shell
`jbh-page`, exported from `@design-system/platform`, SHALL be the only root element of every routed page template. It SHALL render projected content marked `jbhPageHeader` above the scroll area and all other projected content inside the scroll area. Pages SHALL style the shell only through the CSS custom properties `--jbh-page-background`, `--jbh-page-padding-top` and `--jbh-page-padding-bottom`, set on the `jbh-page` element.

#### Scenario: Header and content
- **WHEN** a page template is `<jbh-page><app-header jbhPageHeader></app-header><div class="x"></div></jbh-page>`
- **THEN** `app-header` renders before the scroll area and `div.x` renders inside it

#### Scenario: Page background
- **WHEN** a page SCSS sets `--jbh-page-background: var(--jbh-background-light)` on its `jbh-page` element
- **THEN** the scroll area background uses that color

### Requirement: Page enter and leave events
`jbh-page` SHALL emit `pageEnter` each time its routed page is about to become visible, including when the router shows a cached page again. It SHALL emit `pageLeave` each time the page is about to be hidden. It SHALL get these moments from the Ionic page events (`ionViewWillEnter`, `ionViewWillLeave`) that Ionic dispatches on the routed page element, which is the parent element of `jbh-page`. It SHALL start listening when it is created, before the first page transition, and SHALL stop listening when it is destroyed. The `pageEnter` handler SHALL run inside the Angular zone, so an `OnPush` page updates its view without a manual `markForCheck` for state set synchronously in the handler.

#### Scenario: First visit
- **WHEN** the parent element of `jbh-page` receives the event `ionViewWillEnter`
- **THEN** `pageEnter` emits exactly once

#### Scenario: Return to a cached page
- **WHEN** the parent element receives `ionViewWillEnter` a second time
- **THEN** `pageEnter` emits a second time

#### Scenario: Leave
- **WHEN** the parent element receives `ionViewWillLeave`
- **THEN** `pageLeave` emits once

#### Scenario: After destroy
- **WHEN** `jbh-page` is destroyed and then the parent element receives `ionViewWillEnter`
- **THEN** `pageEnter` does not emit

### Requirement: Toolbar
`jbh-toolbar` SHALL render the page toolbar with a `title`, a menu button or a back button (`back` input), an optional `backHref` used when there is no history, and action buttons from an `actions` input (`id`, `icon`, optional `label`, `handler`). Each action button SHALL have an accessible name (the `label`, or the `id` when no label is given).

#### Scenario: Back button with fallback
- **WHEN** `back` is true and `backHref` is `/settings/teams/overview` and the user opened the page directly
- **THEN** the back button is visible and goes to `/settings/teams/overview`

#### Scenario: Action
- **WHEN** the user taps the action with `id` `refresh`
- **THEN** its `handler` runs once

### Requirement: Toast service
`ToastService.show(message, tone)` SHALL show a toast for 3000 ms at the bottom of the screen with a close button. `tone` SHALL be one of `success`, `error`, `warning`, `info` (default `info`), mapped to the Ionic colors `success`, `danger`, `warning`, `medium`.

#### Scenario: Error toast
- **WHEN** a page calls `show('Could not save', 'error')`
- **THEN** a toast is created with message `Could not save`, duration 3000, position `bottom`, color `danger` and one close button, and it is presented

### Requirement: Dialog service
`DialogService.confirm(options)` SHALL show a confirm dialog with `title`, `message`, a cancel button (`cancelText`, default the translated `common.cancel`) and a confirm button (`confirmText`). With `destructive: true` the confirm button SHALL use the destructive style. It SHALL resolve `true` when the user confirms and `false` when the user cancels or dismisses it. `DialogService.open(component, { sheet })` SHALL open a component in a modal, as a bottom sheet when `sheet` is true. `DialogService.close()` SHALL close the top modal.

#### Scenario: Confirm
- **WHEN** a page awaits `confirm({ title: 'Delete', message: 'Sure?', confirmText: 'Delete', destructive: true })` and the user taps Delete
- **THEN** the promise resolves `true`

#### Scenario: Cancel
- **WHEN** the user taps Cancel or the backdrop
- **THEN** the promise resolves `false`

### Requirement: Navigation service
`NavigationService.closeMenu()` SHALL close the side menu and resolve when it is closed. Pages and shared components SHALL keep using the Angular `Router` for navigation between routes.

#### Scenario: Menu item navigation
- **WHEN** the menu calls `closeMenu()` and then `router.navigate(['/dashboard'])`
- **THEN** the menu is closed before the navigation starts

### Requirement: Viewport helper
The layer SHALL provide a viewport helper that reports whether the viewport is at least 1024 px wide and updates the value on window resize (debounced by 100 ms). It SHALL not depend on Ionic.

#### Scenario: Resize
- **WHEN** the window width changes from 800 px to 1280 px
- **THEN** after the debounce the helper reports a wide viewport

### Requirement: Device platform port
Core services SHALL ask device questions through an abstract `DevicePlatform` class in `src/app/core/infrastructure/platform/` with `isNativeApp()`, `isIos()` and `isAndroid()`. The layer SHALL implement it with Ionic `Platform` (`hybrid`, `ios`, `android`). `src/main.ts` SHALL bind the port to the Ionic adapter. `TokenRefreshService`, `PushNotificationService` and `PwaInstallService` SHALL use the port and SHALL NOT import Ionic.

#### Scenario: Native app
- **WHEN** Ionic `Platform.is('hybrid')` returns true
- **THEN** `isNativeApp()` returns true

#### Scenario: iOS browser
- **WHEN** `Platform.is('ios')` returns true and `Platform.is('hybrid')` returns false
- **THEN** `isIos()` returns true and `isNativeApp()` returns false

### Requirement: Header config keeps working and gains a back fallback
`PageHeaderConfig` in `HeaderActionsService` SHALL gain an optional `defaultBackHref`. `app-header` SHALL pass it to `jbh-toolbar` as `backHref`. Existing configs without it SHALL behave as before.

#### Scenario: Edit team page
- **WHEN** the edit team page sets `{ title: 'teams.edit.title', showBackButton: true, defaultBackHref: '/settings/teams/overview' }`
- **THEN** the toolbar shows a back button that falls back to `/settings/teams/overview`
