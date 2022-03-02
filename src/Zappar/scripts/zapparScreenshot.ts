var zapparScreenshot = pc.createScript('zapparScreenshot') as Z.Type.ZapparScreenshot;

declare let ZapparWebGLSnapshot: Z.Type.ZapparWebGLSnapshot;

zapparScreenshot.attributes.add('downloadOptions', {
    type: 'json',
    schema: [
        {
            title: 'File Name',
            name: 'downloadFileName',
            type: 'string',
            default: "ZapparPlaycanvas"
        },
        {
            title: 'Image Quality',
            name: 'imageQuality',
            type: 'number',
            default: 0.95,
            min: 0.1,
            max: 1.0,
        },
        {
            name: 'imageFormat',
            title: 'Image Format',
            type: 'string',
            enum: [
                { 'image/png': 'image/png' },
                { 'image/jpeg': 'image/jpeg' },
            ],
            default: 'image/png',
        }
    ]
});

zapparScreenshot.attributes.add('shareOptions', {
    type: 'json',
    schema: [
        {
            title: 'Show Share Button',
            name: 'shareButton',
            type: 'boolean',
            default: true,
            description: "Should the social share button be visible?"
        },
        {
            title: 'Share Title',
            name: 'shareTitle',
            type: 'string',
            default: "Zappar"
        },
        {
            title: 'Share Text',
            name: 'shareText',
            type: 'string',
            default: "Check out this snapshot!"
        },
        {
            title: 'Share URL',
            name: 'shareUrl',
            type: 'string',
            default: "www.zappar.com"
        }
    ]
});


zapparScreenshot.attributes.add('localisation', {
    type: 'json',
    schema: [
        {
            title: 'Save Button',
            name: 'SaveButtonText',
            type: 'string',
            default: "SAVE"
        },
        {
            title: 'Share Button',
            name: 'ShareButtonText',
            type: 'string',
            default: "SHARE"
        },
        {
            title: 'Open Files App to Share',
            name: 'NowOpenFilesAppToShare',
            type: 'string',
            default: "Now open files app to share"
        },
        {
            title: 'Tap and Hold to Share',
            name: 'TapAndHoldToSave',
            type: 'string',
            default: "Tap and hold the image<br/>to save to your Photos app"
        },
    ]
});




zapparScreenshot.prototype.initialize = function() {
    this.needsCapture = false;
    this.app.on('postrender', this.postRender, this);

    this.app.on('zappar:capture_snapshot',  ()=>{
        this.needsCapture = true;
    });

};

zapparScreenshot.prototype.postRender = function () {
    if(this.needsCapture){
        this.needsCapture = false;
        const image = this.app.graphicsDevice.canvas.toDataURL();
        ZapparWebGLSnapshot.default({
            data: image,
            hideShareButton: !this.shareOptions.shareButton,
            shareTitle: this.shareOptions.shareTitle,
            shareUrl: this.shareOptions.shareUrl,
            shareText: this.shareOptions.shareText,
            fileNamePrepend: this.downloadOptions.downloadFileName,
            onSave: () => {
                this.app.fire("zappar:snapshot", { message: 'snapshot_saved' });
            },
            onShare: () => {
                this.app.fire("zappar:snapshot", { message: 'snapshot_shared' });
            },
            onClose: () => {
                this.app.fire("zappar:snapshot", { message: 'snapshot_closed' });
            }
        }, {},
        {
            SAVE: this.localisation.SAVE,
            SHARE: this.localisation.SHARE,
            NowOpenFilesAppToShare: this.localisation.NowOpenFilesAppToShare,
            TapAndHoldToSave: this.localisation.TapAndHoldToSave,
        })
    }
};
