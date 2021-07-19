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
        const zapparCanvasImage =  (document.getElementById('ZapparCanvas') as HTMLCanvasElement).toDataURL();
        const pcCanvasImage = this.app.graphicsDevice.canvas.toDataURL();
        this.mergeImages([{src: zapparCanvasImage}, {src: pcCanvasImage}]).then(b64 => (ZapparWebGLSnapshot).default({
            data: b64,
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
        }));
    }
};

// MIT License https://github.com/lukechilds/merge-images

// Copyright (c) 2016 Luke Childs

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
zapparScreenshot.prototype.mergeImages = function(sources, options = {}) {

    const defaultOptions = {
        format: this.downloadOptions.imageFormat,
        quality: this.downloadOptions.imageQuality,
        width: undefined,
        height: undefined,
        Canvas: undefined,
        crossOrigin: undefined
    };

    return new Promise(resolve => {
        options = Object.assign({}, defaultOptions, options);

        const canvas = window.document.createElement('canvas');


        // Load sources
        const images = sources.map(source => new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.crossOrigin = options.crossOrigin;
            img.onerror = () => reject(new Error('Couldn\'t load image'));
            img.onload = () => resolve(Object.assign({}, source, { img }));
            img.src = source.src;
        }));

        // Get canvas context
        const ctx = canvas.getContext('2d');

        // When sources have loaded
        resolve(Promise.all(images)
            .then((images : any) => {
                // Set canvas dimensions
                const getSize = (dim: string) => options[dim] || Math.max(...images.map((image: { img: { [x: string]: any; }; }) => image.img[dim]));
                canvas.width = getSize('width');
                canvas.height = getSize('height');

                // Draw images to canvas
                images.forEach((image: { opacity: number; img: any, x: number; y: number; }) => {
                    ctx!.globalAlpha = image.opacity ? image.opacity : 1;
                    return ctx!.drawImage(image.img, image.x || 0, image.y || 0);
                });

                // Resolve all other data URIs sync
                return canvas.toDataURL(options.format, options.quality);
            }));
    });
};
