import dotenv from "dotenv"
dotenv.config()
import { notarize } from '@electron/notarize'

export default async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') {
        return;
    }

    const appName = context.packager.appInfo.productFilename;
    console.log("Begin notarizing");

    return await notarize({
        appBundleId: 'space.imsc.desktop',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: process.env.APPLEID,
        appleIdPassword: process.env.APPLEIDPASS,
        teamId: process.env.APPLETEAM,
        ascProvider: process.env.APPLETEAM,
    });
};
