# next-feature-flags

Add support for feature flags on Next.js based on cookies + environment variables.

# How it works

It reads from cookies and Next.js's runtime config and provides an interface to enable and disable feature flags.

An interface to toggle feature flags on the browser is also provided via `window.FEATURES`.

It prioritizes feature flags from cookies over Next.js runtime config, meaning that if the same feature flag is set on both sides, the **cookie** one prevails.

# Setup

```js
import { configure } from 'next-feature-flags';

configure({
  featureFlags: ['SHOW_LOGIN_BANNER', 'USER_ESCALATE_PRIVILEGES'],
  allowCookieOverride: ['SHOW_LOGIN_BANNER']
})
```

`featureFlags` - lists the feature flags available 

`allowCookieOverride` - lists the features flags which can be overriden by setting a cookie. This enables for some safety and not letting users override critical feature flags

# Usage

```js
import { configure } from 'next-feature-flags';

const { getFeatureFlag } = configure({
  featureFlags: ['SHOW_LOGIN_BANNER', 'USER_ESCALATE_PRIVILEGES'],
  allowCookieOverride: ['SHOW_LOGIN_BANNER']
})

const shouldShowLoginBanner = () => getFeatureFlag('SHOW_LOGIN_BANNER')
```

**Note:** `next-feature-flags` uses the `FEATURE` key both to write/read from cookies and from the environment, meaning the if you send `SHOW_LOGIN_BANNER` `next-feature-flags` will try to read from `FEATURE_SHOW_LOGIN_BANNER` and will read/write from that same cookie. 

Possible improvement: customize this key.

## Overriding feature flags on the browser

To override feature flags on the client, use the `window.FEATURES` interface.

On the console:

```js
> window.FEATURES
> {SHOW_LOGIN_BANNER: {enable: fn, disable: fn}}
> window.FEATURES.SHOW_LOGIN_BANNER.enable()
> 'FEATURES_SHOW_LOGIN_BANNER=true'
```

Using this interface will set the cookie value (FEATURES_SHOW_LOGIN_BANNER), if you're using the feature flags on the server side (like `getServerSideProps`) make sure you reload your browser.

Whenever you want to turn it off, you can use the `disable` method the same way.

## Using feature flags from the environment

`next-feature-flags` gets environment variables from Next.js runtime config (https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration).

To expose these variables there (and make them available both on the client and server side), use them the following way:

```js
// next.config.js
module.exports = {
  serverRuntimeConfig: {
    SHOW_LOGIN_BANNER: process.env.FEATURE_SHOW_LOGIN_BANNER, // Pass through env variables
  },
  publicRuntimeConfig: {
    SHOW_LOGIN_BANNER: process.env.NEXT_PUBLIC_FEATURE_SHOW_LOGIN_BANNER
  },
}
```

By having the variables with the same name (even though one is getting from the public namespace and the other not) makes it possible for `next-feature-flags` to get them. It will prioritize the value in `serverRuntimeConfig` over `publicRuntimeConfig`.

