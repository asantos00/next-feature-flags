import { configure } from "./index";
import { JSDOM } from "jsdom";
import { GetServerSidePropsContext } from "next";
import getConfig from "next/config";

const utilMockGetConfigForEnvVariable = (obj: Record<string, string>) => {
  (getConfig as jest.Mock).mockReturnValue({
    serverRuntimeConfig: { ...obj },
    publicRuntimeConfig: { ...obj },
  });
};

jest.mock("next/config");

describe("basic configuration", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    utilMockGetConfigForEnvVariable({});
  });

  it("runs without throwing", () => {
    expect(() => configure()).not.toThrow();
  });

  it("returns false by default for any feature flag", () => {
    const { getFeatureFlag } = configure();

    expect(getFeatureFlag("abcd")).toBe(false);
  });

  it("warns when using a feature flag that doesnt exist", () => {
    const { getFeatureFlag } = configure({
      debug: true,
      allowCookieOverride: [],
      featureFlags: ["abcd"],
    });

    console.warn = jest.fn();

    getFeatureFlag("abcd");

    expect(console.warn).toHaveBeenCalledWith(
      'Feature flag "abcd" does not exist on next-feature-flags'
    );
  });
});

describe("get feature flag from cookie", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    utilMockGetConfigForEnvVariable({});
    const dom = new JSDOM();
    global.document = dom.window.document;
    global.window = dom.window;
  });
  it("returns true for feature flag defined on cookie", () => {
    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    document.cookie = "FEATURE_FOO=true";

    expect(getFeatureFlag("FOO")).toBeTruthy();
  });

  it("returns false for feature flag defined on cookie as false", () => {
    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    document.cookie = "STUFF=true;abcd=123;auth=asbcd;FEATURE_FOO=false";

    expect(getFeatureFlag("FOO")).toBeFalsy();
  });

  it("returns false for feature flag defined on cookie as random value", () => {
    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    document.cookie = "STUFF=true;abcd=123;auth=asbcd;FEATURE_FOO=4125214";

    expect(getFeatureFlag("FOO")).toBeFalsy();
  });

  it("returns false for feature flag not defined on cookie", () => {
    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    document.cookie = "STUFF=true;abcd=123;auth=asbcd;";

    expect(getFeatureFlag("FOO")).toBeFalsy();
  });

  it("server side - cookie as true", () => {
    //@ts-ignore
    window = undefined;

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    const contextMock = {
      req: {
        cookies: { FEATURE_FOO: "true" },
      } as unknown as GetServerSidePropsContext["req"],
    } as unknown as GetServerSidePropsContext;

    expect(getFeatureFlag("FOO", contextMock)).toBeTruthy();
  });

  it("server side - cookie as empty", () => {
    //@ts-ignore
    window = undefined;

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    const contextMock = {
      req: {
        cookies: { FEATURE_FOO: "" },
      } as unknown as GetServerSidePropsContext["req"],
    } as unknown as GetServerSidePropsContext;

    expect(getFeatureFlag("FOO", contextMock)).toBeFalsy();
  });

  it("server side - cookie not present", () => {
    //@ts-ignore
    window = undefined;

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    const contextMock = {
      req: {
        cookies: { FEATURE_STUFF: "true" },
      } as unknown as GetServerSidePropsContext["req"],
    } as unknown as GetServerSidePropsContext;

    expect(getFeatureFlag("FOO", contextMock)).toBeFalsy();
  });

  it("server side - no cookies", () => {
    //@ts-ignore
    window = undefined;

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    const contextMock = {
      req: {
        cookies: {},
      } as unknown as GetServerSidePropsContext["req"],
    } as unknown as GetServerSidePropsContext;

    expect(getFeatureFlag("FOO", contextMock)).toBeFalsy();
  });
});

describe("feature flag from env variable", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    utilMockGetConfigForEnvVariable({});
  });

  it("returns true for feature flag defined on env variable", () => {
    utilMockGetConfigForEnvVariable({ FEATURE_FOO: "true" });

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    expect(getFeatureFlag("FOO")).toBeTruthy();
  });

  it("returns false for feature flag defined on env as false", () => {
    utilMockGetConfigForEnvVariable({
      FEATURE_FOO: "false",
      FEATURE_BLA: "true",
    });

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO", "BLA"],
      allowCookieOverride: ["FOO"],
    });

    expect(getFeatureFlag("FOO")).toBeFalsy();
    expect(getFeatureFlag("BLA")).toBeTruthy();
  });

  it("returns false for feature flag defined on env as random value", () => {
    utilMockGetConfigForEnvVariable({
      FEATURE_FOO: "false",
      FEATURE_BLA: "true",
    });

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    expect(getFeatureFlag("FOO")).toBeFalsy();
  });

  it("returns false for feature flag not defined on env", () => {
    utilMockGetConfigForEnvVariable({});

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    expect(getFeatureFlag("FOO")).toBeFalsy();
  });

  it("returns true for feature flag defined as true", () => {
    utilMockGetConfigForEnvVariable({ FEATURE_FOO: "true" });

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    process.env.FEATURE_FOO = "true";

    expect(getFeatureFlag("FOO")).toBeTruthy();
  });

  it("returns true for feature flag defined as 1", () => {
    utilMockGetConfigForEnvVariable({ FEATURE_FOO: "1" });

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    expect(getFeatureFlag("FOO")).toBeTruthy();
  });

  it("returns false when empty", () => {
    utilMockGetConfigForEnvVariable({ FEATURE_FOO: "" });

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    expect(getFeatureFlag("FOO")).toBeFalsy();
  });

  it("returns false when variable not present", () => {
    utilMockGetConfigForEnvVariable({});

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    expect(getFeatureFlag("FOO")).toBeFalsy();
  });

  it("returns false on no env defined", () => {
    utilMockGetConfigForEnvVariable({});

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    expect(getFeatureFlag("FOO")).toBeFalsy();
  });
});

describe("cookie overriding env on allowed variables", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    const dom = new JSDOM();
    global.document = dom.window.document;
    global.window = dom.window;
    utilMockGetConfigForEnvVariable({});
  });

  it("prefers cookie false over env when allowCookieOverride enabled", () => {
    utilMockGetConfigForEnvVariable({ FEATURE_FOO: "true" });

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    document.cookie = "FEATURE_FOO=false;something=wrong";

    expect(getFeatureFlag("FOO")).toBeFalsy();
  });

  it("prefers cookie true over env when allowCookieOverride enabled", () => {
    utilMockGetConfigForEnvVariable({ FEATURE_FOO: "false" });

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO"],
      allowCookieOverride: ["FOO"],
    });

    document.cookie = "FEATURE_FOO=true;something=wrong";

    expect(getFeatureFlag("FOO")).toBeTruthy();
  });

  it("gets env value when variable is not in allowCookieOVerride", () => {
    utilMockGetConfigForEnvVariable({
      FEATURE_FOO: "false",
      FEATURE_BAR: "true",
    });

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO", "BAR"],
      allowCookieOverride: ["FOO"],
    });

    document.cookie = "FEATURE_FOO=true;FEATURE_BAR=false";

    expect(getFeatureFlag("BAR")).toBeTruthy();
    expect(getFeatureFlag("FOO")).toBeTruthy();
  });
});

describe("window interface", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    const dom = new JSDOM();
    global.document = dom.window.document;
    global.window = dom.window;
    utilMockGetConfigForEnvVariable({});
  });

  it("makes it possible to enable a variable via window", () => {
    document.cookie = "FEATURE_FOO=true";
    document.cookie = "FEATURE_BAR=false";

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO", "BAR"],
      allowCookieOverride: ["FOO", "BAR"],
    });

    expect(getFeatureFlag("BAR")).toBeFalsy();
    window.FEATURES.BAR.enable();

    expect(getFeatureFlag("FOO")).toBeTruthy();
    window.FEATURES.FOO.disable();

    expect(getFeatureFlag("BAR")).toBeTruthy();
    expect(getFeatureFlag("FOO")).toBeFalsy();
  });

  it("shows state of the feature from cookie", () => {
    document.cookie = "FEATURE_FOO=true";
    document.cookie = "FEATURE_BAR=false";

    configure({
      featureFlags: ["FOO", "BAR"],
      allowCookieOverride: ["FOO", "BAR"],
    });

    expect(window.FEATURES.BAR.state()).toBeFalsy();
    expect(window.FEATURES.FOO.state()).toBeTruthy();
  });

  it("only provide interface to overridable variables", () => {
    document.cookie = "FEATURE_FOO=true";
    document.cookie = "FEATURE_BAR=false";

    const { getFeatureFlag } = configure({
      featureFlags: ["FOO", "BAR"],
      allowCookieOverride: ["FOO"],
    });

    expect(getFeatureFlag("FOO")).toBeTruthy();
    expect(getFeatureFlag("BAR")).toBeFalsy();

    expect(window.FEATURES.BAR).toBeFalsy();
  });
});
