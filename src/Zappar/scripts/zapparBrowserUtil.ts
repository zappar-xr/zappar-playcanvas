/* jshint esversion: 6 */
const zapparBrowserUtil = pc.createScript('zapparBrowserUtil') as Z.Type.BrowserUtil

zapparBrowserUtil.attributes.add('Mobile Only', {
    type: 'boolean',
    default: false,
    description: "Redirect users to mobile"
});

zapparBrowserUtil.attributes.add('Compatibility Check', {
    type: 'boolean',
    default: false,
    description: "Perform compatability checks"
});


zapparBrowserUtil.prototype.initialize = function () {
    /**
     * SDK version.
    */
    const VERSION="CI_COMMIT_TAG";
    console.log(`Zappar for PlayCanvas v${VERSION}`);

    if (this['Compatibility Check']){
        if (Zappar.browserIncompatible()) {
            Zappar.browserIncompatibleUI();
            this.app.autoRender = false;
        }
    }

    if (this['Mobile Only']){
        if (!MobileOnly.isMobile()){
            MobileOnly.showUI();
            this.app.autoRender = false;
        }
    }

};
