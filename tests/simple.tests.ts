import * as util from '@zappar/jest-console-logs';
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
    },
    {
        name : "OptanonConsent",
        value: "isGpcEnabled=0&datestamp=Fri+Jan+07+2022+15%3A18%3A43+GMT%2B0000+(Greenwich+Mean+Time)&version=6.18.0&isIABGlobal=false&hosts=&landingPath=https%3A%2F%2Flogin.playcanvas.com%2F%3Fcame_from%3Dhttps%253A%252F%252Fplaycanvas.com%252Feditor%252Fscene%252F1275139%252Flaunch%253Fdebug%253Dtrue",
        domain: "playcanvas.com",
        path: "/",
        expires: 4294967295,
        httpOnly: false,
        secure: false,
        session: true
    },
    {
        name : "OptanonConsent",
        value: "isGpcEnabled=0&datestamp=Fri+Jan+07+2022+15%3A18%3A43+GMT%2B0000+(Greenwich+Mean+Time)&version=6.18.0&isIABGlobal=false&hosts=&landingPath=https%3A%2F%2Flogin.playcanvas.com%2F%3Fcame_from%3Dhttps%253A%252F%252Fplaycanvas.com%252Feditor%252Fscene%252F1275139%252Flaunch%253Fdebug%253Dtrue&groups=C0001%3A1%2CC0002%3A0%2CC0004%3A0",
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

    it('console logs/screnshot', async () => {

        const page = await browser.newPage();
        await page.setCookie(...cookies);
        page.goto(url, { timeout: 0 });
        await page.waitForSelector("canvas");

        await util.expectLogs({
            expected: [
                /Zappar JS v\d*.\d*.\d*/,
                /Zappar CV v\d*.\d*.\d*/,
                /^Zappar for PlayCanvas v/,
                "[Zappar] INFO pipeline_t initialized",
                "[Zappar] INFO identity for license check: launch.playcanvas.com",
                "[Zappar] INFO face_tracker_t initialized",
                "face tracking model loaded",
                "[Zappar] INFO html_element_source_t initialized",
                "[Zappar] INFO html_element_source_t initialized",
                "New anchor has appeared: 0",
                "Anchor is visible: 0"
            ],
            page: page as any,
            timeoutMs: 120000
        });


        const screenshot = await page.screenshot();

        expect(screenshot).toMatchImageSnapshot({
            customDiffConfig: {
            threshold: 0.025,
            },
            failureThreshold: 0.035,
            failureThresholdType: "percent",
        });

        await page.close();
    });

});
