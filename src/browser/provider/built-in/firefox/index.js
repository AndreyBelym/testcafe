import OS from 'os-family';
import getRuntimeInfo from './runtime-info';
import { start as startLocalFirefox, stop as stopLocalFirefox } from './local-firefox';
import MarionetteClient from './marionette-client';
import getConfig from './config';
import getMaximizedHeadlessWindowSize from '../../utils/get-maximized-headless-window-size';


export default {
    openedBrowsers: {},

    isMultiBrowser: false,

    async _createMarionetteClient (runtimeInfo) {
        try {
            var marionetteClient = new MarionetteClient(runtimeInfo.marionettePort);

            await marionetteClient.connect();

            return marionetteClient;
        }
        catch (e) {
            return null;
        }
    },

    async openBrowser (browserId, pageUrl, configString) {
        var runtimeInfo = await getRuntimeInfo(configString);
        var browserName = this.providerName.replace(':', '');

        runtimeInfo.browserId   = browserId;
        runtimeInfo.browserName = browserName;

        await startLocalFirefox(pageUrl, runtimeInfo);

        await this.waitForConnectionReady(runtimeInfo.browserId);

        runtimeInfo.marionetteClient = await this._createMarionetteClient(runtimeInfo);

        this.openedBrowsers[browserId] = runtimeInfo;
    },

    async closeBrowser (browserId) {
        var runtimeInfo = this.openedBrowsers[browserId];
        var { config, marionetteClient } = runtimeInfo;

        if (config.headless)
            await marionetteClient.quit();
        else
            await this.closeLocalBrowser(browserId);

        if (OS.mac && !config.headless)
            await stopLocalFirefox(runtimeInfo);

        delete this.openedBrowsers[browserId];
    },

    async isLocalBrowser (browserId, configString) {
        var config = this.openedBrowsers[browserId] ? this.openedBrowsers[browserId].config : getConfig(configString);

        return !config.headless;
    },

    async takeScreenshot (browserId, path) {
        var { marionetteClient } = this.openedBrowsers[browserId];

        await marionetteClient.takeScreenshot(path);
    },

    async resizeWindow (browserId, width, height) {
        var { marionetteClient } = this.openedBrowsers[browserId];

        await marionetteClient.setWindowSize(width, height);
    },

    async maximizeWindow (browserId) {
        const maximumSize = getMaximizedHeadlessWindowSize();

        await this.resizeWindow(browserId, maximumSize.width, maximumSize.height);
    },

    async hasCustomActionForBrowser (browserId) {
        var { config, marionetteClient } = this.openedBrowsers[browserId];

        return {
            hasCloseBrowser:                true,
            hasTakeScreenshot:              !!marionetteClient,
            hasChromelessScreenshots:       !!marionetteClient,
            hasResizeWindow:                !!marionetteClient && config.headless,
            hasMaximizeWindow:              !!marionetteClient && config.headless,
            hasCanResizeWindowToDimensions: false
        };
    }
};
