import {
    AddToQueue,
    appInfo,
    DbHelperUi,
    FromQueue,
    Job,
    Launcher,
    logger,
    OnStart,
    Page,
    PuppeteerUtil,
    PuppeteerWorkerFactory, RequestUtil
} from "ppspider";
import {config} from "./config";
// import * as cheerio from "cheerio";
// import * as url from "url";


class TestTask {

    @OnStart({urls: config.startUrl}) // execute once after startup
    @FromQueue({name: "sub_urls", parallel: 1, exeInterval: 5000}) // fetch job from queue and execute
    @AddToQueue({name: "sub_urls"}) // add the return to queue
    async roamingDynamicWebsiteByPuppeteer(job: Job, page: Page) {
        await PuppeteerUtil.defaultViewPort(page); // set default viewport
        await PuppeteerUtil.setImgLoad(page, false); // disable image load
        await page.goto(job.url); // open url

        const title = await page.evaluate(() => document.title); // get page title
        logger.info(job.url + " " + title); // write a log
        await appInfo.db.save("urlTitles", {_id: job._id, url: job.url, title: title}); // save data to db

        if (job.depth == 0) {
            // in the first job, test screenshot
            await page.screenshot({
                path: appInfo.workplace + "/screenshot.png",
                type: "png"
            });
        }

        // find and return sub links
        return await PuppeteerUtil.links(page, {
            sub_urls: "^https?://.*"
        });
    }

    // // if you want to get something from static web page, add "cheerio": "^1.0.0-rc.3" to package.json/dependencies and "@types/cheerio": "^0.22.11" to package.json/devDependencies
    // @OnStart({urls: config.startUrl}) // execute once after startup
    // @FromQueue({name: "sub_urls", parallel: 1, exeInterval: 5000}) // fetch job from queue and execute
    // @AddToQueue({name: "sub_urls"}) // add the return to queue
    // async roamingStaticWebsiteByRequestAndCheerio(job: Job) {
    //     const headers: any = {
    //         "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"
    //     };
    //     job.datas.referer && (headers.referer = job.datas.referer);
    //     const res = await RequestUtil.simple({url: job.url, headers: headers});
    //     const $ = cheerio.load(res.body);
    //
    //     const title = $("title").text(); // get page title
    //     logger.info(job.url + " " + title); // write a log
    //     await appInfo.db.save("urlTitles", {_id: job._id, url: job.url, title: title}); // save data to db
    //
    //     // find and return sub links
    //     return $("a").map((eleI, ele) => {
    //         try {
    //             let href = url.resolve(job.url, ele.attribs.href);
    //             if (href.match("^https?://.*")) {
    //                 return href;
    //             }
    //         }
    //         catch (e) {
    //         }
    //     }).get().filter(item => item);
    // }

}



@Launcher({
    workplace: "workplace",
    dbUrl: "mongodb://localhost:27017/ppspider_docker_deploy",
    tasks: [
        TestTask
    ],
    workerFactorys: [
        new PuppeteerWorkerFactory(config.puppeteer)
    ],
    dataUis: [
        DbHelperUi
    ],
    webUiPort: config.webUiPort
})
class App {}
