import {LaunchOptions} from "puppeteer";

export const config = {
    puppeteer: {
        headless: true,
        devtools: false,
        args: [
            "--no-sandbox"
        ]
    } as LaunchOptions,
    webUiPort: 9000,
    startUrl: "https://www.baidu.com/"
};
