# KRDS Naming Reference

Use this file for KRDS naming decisions involving tokens, variables, component names, and design-file naming conventions.

Official source:

- `utility_03`: <https://www.krds.go.kr/html/site/utility/utility_03.html>
- supplemental token structure: <https://www.krds.go.kr/html/site/style/style_07.html>

Detailed research note:

- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/token-naming-utility-03.md`

## 1. Core Principles

Apply these by default:

- use logical structure
- exclude visual appearance from names
- keep names extensible
- keep notation consistent
- avoid abbreviations

Practical interpretation:

- prefer role names over appearance names
- prefer full words over short aliases
- keep naming stable when visuals change

## 2. Separator Rules

KRDS naming uses different separators for different contexts.

### Token-affecting names

- lowercase only
- hyphen `-` is the default token delimiter
- underscore `_` is used for some design-file token-related naming
- double underscore `__` can separate component and type in component naming

### Human-readable design-file names

For page, frame, and property display names, readability is preferred over token-style naming.

- spaces are allowed
- English + Korean can be shown together
- display names may use leading capitals where appropriate

## 3. What Counts as Token-Affecting

The KRDS page explicitly treats these as naming that affects tokens:

- component names used with tokens
- local variables
- local styles
- code-facing token names

Use stricter normalization here than you would for page or frame labels.

## 4. Token Naming Defaults

- default delimiter: `-`
- default case: lowercase
- semantic naming first

Good direction:

- `color-primary-50`
- `typography-font-size-body-medium`
- `spacing-gap-4`
- `button-text-primary-hover`

Bad direction:

- `blue-button`
- `btn-text-hov`
- `rounded-big-card`

## 5. Semantic Category Rules

### Color

Prefer semantic roles such as:

- `primary`
- `secondary`
- `gray`

Avoid raw color words when the name is meant to be reusable across themes.

Scale values should use numeric steps, typically by tens, with optional fives for finer granularity.

Examples:

- `primary-10`
- `primary-20`
- `primary-55`

### Typography

Use explicit type names.

Examples:

- `font-family`
- `font-size`
- `line-height`

### Number tokens

This usually includes:

- spacing
- radius
- size-height

Use orderly scales from small to large. Prefer `small`, `medium`, `large` when the token is semantic.

## 6. Axis Order

For actual token naming, use only the axes you need, in order:

`namespace-theme-category-component-type-variant-element-state-size-modifier`

Representative values:

- namespace: `krds`
- theme: `light`, `high-contrast`
- category: `color`, `typography`, `spacing`, `shape`
- component: `button`, `input`, `link`, `card`
- type: `background`, `surface`, `text`, `icon`, `padding`
- variant: `primary`, `secondary`, `danger`, `warning`, `success`, `info`
- element: `label`, `title`, `body`, `line`
- state: `default`, `hover`, `pressed`, `focused`, `disabled`, `error`, `active`, `selected`
- size: `xsmall`, `small`, `medium`, `large`, `xlarge`
- modifier: `rounded`, `square`, `fill`, `line`, `subtle`, `bold`, `light`, `darker`

Do not force every axis into every token. Add axes only when they add meaning.

## 7. State and Modifier Discipline

Attach state, size, and modifier late in the name.

Preferred shape:

- base role first
- then variant
- then element
- then state
- then size or modifier

Examples:

- `button-background-primary-hover`
- `input-border-error`
- `card-surface-default`

## 8. Review Heuristics

Flag these issues:

- semantic and visual names mixed in one family
- abbreviations like `bg`, `txt`, `btn`, `xs`
- mixed separators in the same token namespace
- state or size placed before the main role
- names that describe current styling rather than function

## 9. What to Produce

When the user asks for naming help, respond with:

1. current problem
2. KRDS-aligned replacement
3. axis breakdown
4. migration notes if renaming touches code
