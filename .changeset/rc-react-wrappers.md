---
'@rcarls/rc-react': minor
---

Adds `@rcarls/rc-react`: generated `@lit/react` wrappers for every element, one subpath per
component package (such as `@rcarls/rc-react/rc-select`). Each wrapper registers its element,
sets element properties from props, maps custom events to `on` props in camel case (such as
`onRcSelectChange`), and types its ref as the element class. The root export adds
`RcRegister`, which loads the definitions for plain tags a server component renders.
