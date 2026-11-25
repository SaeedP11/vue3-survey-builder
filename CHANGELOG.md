# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.16.0] - 2026-11-22

### Added

- **Result Templates**: Allow customizable score point bounds for status tiers.
- **Designer**: Automatically open on the designer tab and select the first question upon JSON form load.

## [3.15.0] - 2026-11-16

### Added

- **Chat Survey Mode**: Implement modular chat mode architecture with adaptive shells and polymorphic question inputs.
- **Persian Datetime**: Add Jalali/Persian datetime picker for survey questions and designer toolbox.
- **Serialization**: Register survey `mode` and `chatConfig` serializer properties.
- **Playground**: Add 10 diverse domain example forms and interactive showcase test forms.

### Fixed

- **Chat**: Enhance responsiveness across different screen sizes and add support for date question types in chat mode.
- **Playground**: Auto-sanitize unescaped control characters in the JSON preview panel.

## [3.14.0] - 2026-11-16

### Added

- **Conversational Forms**: Introduce `ChatSurvey` component, in-designer preview, and interactive playground studio.
- **Showcase**: Add bilingual conversational showcase test form and quick load action.

## [3.13.0] - 2026-11-15

### Added

- **Datetime Picker**: Persian datetime picker for survey questions.

## [3.12.0] - 2026-11-10

### Added

- **External Variables**: Support external variables in `FormBuilder` preview and condition suggestions.
- **Conditional Logic**: Support conditions on external variables and props for result actions and blocks.

## [3.10.0] - 2026-11-08

### Added

- **Result Templates**: Add appearance presets, visual score display selector, and revert action.
- **Blocks**: Modularize layout tools; add callout and checklist blocks; elevate appearance tab.

### Fixed

- **Components**: Hook `registerComponent` and support `__vccOpts` in survey component patch.
- **List Items**: Patch survey list item components to prevent extraneous non-props Vue warnings.

## [3.9.1] - 2026-11-07

### Performance

- **Bundle Size**: Lazy load Lucide icons in the icon picker to reduce overall package bundle size.
