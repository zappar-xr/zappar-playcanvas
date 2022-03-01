// playwright.config.ts
import { PlaywrightTestConfig, devices } from "@playwright/test";

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

const useConfig: PropType<PlaywrightTestConfig, "use"> = {
  ignoreHTTPSErrors: true,
  viewport: {
    width: 800,
    height: 800,
  },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  // headless: false,k
  acceptDownloads: true,
};

const config: PlaywrightTestConfig = {
  projects: [
    {
      name: "train - chromium",
      testMatch: /.*.spec.ts/,
      use: { ...devices["Desktop Chrome"], ...useConfig },
    },
    // {
    //   name: "train - firefox",
    //   testMatch: /.*.spec.ts/,
    //   use: { ...devices["Desktop Firefox"], ...useConfig, isMobile: false }, // isMobile not supported by firefox
    // },
    // {
    //   name: "train - webkit",
    //   testMatch: /.*.spec.ts/,
    //   use: { ...devices["Desktop Safari"], ...useConfig },
    // },
  ],
  use: {},
};
export default config;
