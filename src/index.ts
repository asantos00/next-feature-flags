/// <reference types="next" />
import * as Next from "next";
import getConfig from 'next/config';

export const isServer = () => {
  return typeof window === 'undefined';
};

const _parseCookie = (cookie: string) => {
  // FEATURE_HIDE_PLP=true;FEATURE_NO_LOGIN=false;
  return cookie
    .split(';')
    .map((cookieKeyVal) => {
      const [key, val] = cookieKeyVal.split('=');

      return { [key.trim()]: decodeURI(val).trim() };
    })
    .reduce((cookieParsed, keyValPair) => ({ ...cookieParsed, ...keyValPair }));
};

const _stringToBool = (boolString: string) => {
  if (boolString.toLowerCase() === 'true' || boolString === '1') {
    return true;
  }

  return false;
};

export const configure = <KeysType extends string>(
  {
    featureFlags,
    allowCookieOverride,
  }: {
    featureFlags: KeysType[];
    allowCookieOverride: KeysType[];
  } = { featureFlags: [], allowCookieOverride: [] },
) => {
  defineWindowInterface(featureFlags, allowCookieOverride);

  const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

  return {
    getFeatureFlag: (key: KeysType, context?: Next.GetServerSidePropsContext) => {
      const index = `FEATURE_${key}`;

      if (allowCookieOverride.includes(key)) {
        const fromCookie = isServer()
          ? context?.req.cookies[index]
          : _parseCookie(document.cookie)[index];

        if (fromCookie) {
          return _stringToBool(fromCookie);
        }
      }

      const fromEnv = serverRuntimeConfig[index] || publicRuntimeConfig[index];
      if (fromEnv) {
        return _stringToBool(fromEnv);
      }

      console.warn(`Feature flag "${key}" does not exist on next-feature-flags`);
      return false;
    },
  };
};

// Sets an interface on window to enable and disable feature flags
function defineWindowInterface(
  featureFlags: string[],
  allowCookieOverride: string[],
) {
  if (!isServer()) {
    window.FEATURES =
      window.FEATURES ||
        featureFlags.reduce((features, key) => {
        // Only create interface for features with override
        if (!allowCookieOverride.includes(key)) {
          return features;
        }

        return {
          ...features,
          [key]: {
            enable: () => (document.cookie = `FEATURE_${key}=true`),
            disable: () => (document.cookie = `FEATURE_${key}=false`),
          },
        };
      }, {});
  }
}
