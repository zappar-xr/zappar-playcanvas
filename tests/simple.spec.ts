import { test, expect } from '@playwright/test';


require('dotenv').config()

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
test.describe('face tracking', () => {

    test("screenshot", async ({ page, context })=>{
        await context.addCookies(cookies);
        await page.goto(url);
        await page.waitForSelector("canvas");
        //TODO: Console logs instead of timeout.
        await page.waitForTimeout(5000);

        expect(await page.screenshot()).toMatchSnapshot('simple-ft.png', {
            threshold: 0.25
        });

        await page.close();
    })

});
