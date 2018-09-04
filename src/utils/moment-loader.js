import resolveFrom from 'resolve-from';


const MOMENT_MODULE_NAME          = 'moment';
const DURATION_FORMAT_MODULE_NAME = 'moment-duration-format';

function restoreInitialCacheState (module, path) {
    if (module)
        require.cache[path] = module;
    else
        delete require.cache[path];
}

function getSideMomentModulePath (sidePath) {
    try {
        return resolveFrom(sidePath, MOMENT_MODULE_NAME);
    }
    catch (err) {
        return '';
    }
}

function getModulesPaths () {
    const durationFormatModulePath = require.resolve(DURATION_FORMAT_MODULE_NAME);

    return {
        durationFormatModulePath,

        mainMomentModulePath: require.resolve(MOMENT_MODULE_NAME),
        sideMomentModulePath: getSideMomentModulePath(durationFormatModulePath)
    };
}

function getCachedAndCleanModules (modulePath) {
    const cachedModule = require.cache[modulePath];

    delete require.cache[modulePath];

    const cleanModuleExports = require(modulePath);
    const cleanModule        = require.cache[modulePath] || { exports: cleanModuleExports };

    return { cachedModule, cleanModule };
}

function getMomentModules ({ mainMomentModulePath, sideMomentModulePath }) {
    const { cachedModule, cleanModule } = getCachedAndCleanModules(mainMomentModulePath);

    return {
        sideModule: require.cache[sideMomentModulePath],
        mainModule: cleanModule,
        cachedModule
    };
}

function getMomentModuleWithDurationFormatPatch () {
    const modulesPaths  = getModulesPaths();
    const momentModules = getMomentModules(modulesPaths);

    const { sideMomentModulePath, mainMomentModulePath, durationFormatModulePath } = modulesPaths;

    if (sideMomentModulePath && sideMomentModulePath !== mainMomentModulePath) {
        require.cache[sideMomentModulePath] = momentModules.mainModule;

        require(durationFormatModulePath);

        restoreInitialCacheState(momentModules.sideModule, sideMomentModulePath);
    }
    else {
        const durationFormatSetup = require(durationFormatModulePath);

        if (!sideMomentModulePath)
            durationFormatSetup(momentModules.mainModule.exports);
    }

    restoreInitialCacheState(momentModules.cachedModule, mainMomentModulePath);

    return momentModules.mainModule.exports;
}

export default getMomentModuleWithDurationFormatPatch();
