# Changelog

## [1.0.1] - 2021-07-19

### Added

- Snapshot functionality and relevant documentation to `README.md`.

## [1.0.0] - 2021-06-22

- Open sourced on GitHub.

## [0.2.1-beta] - 2021-06-17

### Added

- `zapparBrowserUtil` now contains and logs the current package version.

## [0.2.0-beta] - 2021-06-08

### Added

- `PlayCanvas` events to trackers. Read more about them in the `README.md`.

### Changed

- `Events` sections of `README.md` to mention PlayCanvas events.

### BREAKING CHANGES

- The button entity attached to `Instant Tracker` is no longer disabled on tap, instead it toggles the `placementMode` state. Users should opt for using the events introduced in this update instead.

## [0.1.3-beta] - 2021-06-07

### Added

- Example project URLs to README.md

## [0.1.2-beta] - 2021-06-07

### Fixed

- Issue where CSS mirror mode would not mirror content correctly.

### Added

- `JSDOC` comments to Zappar Scripts.

## [0.1.1-beta] - 2021-06-04

### Fixed

- Camera mirror mode now applies CSS transform to the correct canvas.

## [0.1.0-beta] - 2021-06-04

- Updated dependencies.

### Changed

- UAR now has it's own rendering context to avoid disturbing PlayCanvas WebGL state (additional canvas renders the camera source). You *must* now use `Transparent Canvas` option found in Settings>Rendering.

### Fixed

- An issue where using `post effects` would cause the camera source to not render.
