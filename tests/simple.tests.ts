import * as util from '@zappar/test-utils';
import { toMatchImageSnapshot } from "jest-image-snapshot";

expect.extend({ toMatchImageSnapshot });
require('dotenv').config()
jest.setTimeout(60000);

const cookies = [
    {
        name : "pc_auth",
        value: process.env.COOKIE_VALUE || '',
        domain: ".playcanvas.com",
        path: "/",
        expires: 4294967295,
        httpOnly: true,
        secure: true,
        session: true
    },
    {
        name : "OptanonAlertBoxClosed",
        value: "2021-04-13T10:37:01.062Z",
        domain: "playcanvas.com",
        path: "/",
        expires: 4294967295,
        httpOnly: false,
        secure: false,
        session: true
    }
]


const url = "https://launch.playcanvas.com/1043910?debug=true";
describe('face tracking', () => {

    it('console logs', async () => {
        const page = await browser.newPage();
        await page.setCookie(...cookies);
        page.goto(url);
        await util.expectConsoleLogs([
            /^Powered by PlayCanvas/,
            /Zappar JS v\d*.\d*.\d*/,
            /Zappar CV v\d*.\d*.\d*/,
            /^Zappar for PlayCanvas v/,
            "[Zappar] INFO pipeline_t initialized",
            "[Zappar] INFO identity for license check: launch.playcanvas.com",
            "[Zappar] INFO face_tracker_t initialized",
            "face tracking model loaded",
            "[Zappar] INFO html_element_source_t initialized",
            "New anchor has appeared: 0",
            "Anchor is visible: 0"
        ], page, 30000, new Set(["[Zappar] INFO no display data", "messenger connected"]));
    });

    it('screenshot', async () => {
        const page = await browser.newPage();
        await page.setCookie(...cookies);
        page.goto(url);
        await util.waitForConsoleLog("Anchor is visible: 0", page, 10000);
        const screenshot = await page.screenshot();
        expect(screenshot).toMatchImageSnapshot({
            customDiffConfig: {
            threshold: 0.02,
            },
            failureThreshold: 0.02,
            failureThresholdType: "percent",
        });
    });

});
