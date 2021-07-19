/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import * as mobileOnly from '@zappar/mobile-only';
import type from '@zappar/zappar';
import pc from './playcanvas';
import * as ZapparWebGLSnapshot from '@zappar/webgl-snapshot';
declare namespace Attributes{
    type FaceTracker = pc.Entity & {
        script : { zapparFaceTracker : Prototypes.FaceTracker };
    }

    type ZapparCamera = pc.Entity & {
        script : { zapparCamera : Prototypes.Camera }
    };
}

declare namespace Prototypes{
    type FaceLandmark = {
        'Zappar Camera'?: Attributes.ZapparCamera;
        'Face Tracker'?: Attributes.FaceTracker;
        faceLandmark : type.FaceLandmark;
        'Landmark Target' : 'EYE_LEFT' | 'EYE_RIGHT' | 'EAR_LEFT' | 'EAR_RIGHT' | 'EYEBROW_LEFT' | 'EYEBROW_RIGHT' |'NOSE_BRIDGE' | 'NOSE_TIP' | 'NOSE_BASE' | 'LIP_TOP' | 'LIP_BOTTOM' | 'MOUTH_CENTER' | 'CHIN';
    } & pc.ScriptComponent;

    type FaceTracker= {
        'Zappar Camera'?: Attributes.ZapparCamera
        Camera : Prototypes.Camera
        faceTracker : type.FaceTracker;
        'Max Faces' : number;
        'Target Upright' : boolean;
    } & pc.ScriptComponent;

    type FaceMesh = {
        'Face Tracker'?: Attributes.FaceTracker;
        'Zappar Camera'?: Attributes.ZapparCamera
        ZfaceMesh : type.FaceMesh;
        'Fill mouth' : boolean;
        'Fill eye (left)' : boolean;
        'Fill eye (right)' : boolean;
        material : pc.Material;
        faceTracker : type.FaceTracker
        Camera : Prototypes.Camera
        Mask : boolean
        'Full Head' : boolean
    } & pc.ScriptComponent;

    type imageTracker = {
        'Zappar Camera'?: Attributes.ZapparCamera
        Camera : Prototypes.Camera;
        pipeline : type.Pipeline;
        imageTracker : type.ImageTracker;
        'Target Image' : pc.Asset;
        'Target Upright' : boolean;
    } & pc.ScriptComponent;

    type instantTracker = {
        'Zappar Camera'?: Attributes.ZapparCamera
        'Placement Button'?: pc.Entity;
        Camera : Prototypes.Camera;
        pipeline : type.Pipeline;
        instantTracker : type.InstantWorldTracker
        'Anchor Camera Offset' : [number, number, number],
        hasPlaced : boolean,
        onTouchEnd : ((this: GlobalEventHandlers, ev: MouseEvent & { event : any}) => any)
        onMouseDown : ((this: GlobalEventHandlers, ev: MouseEvent & { event : any}) => any)
    } & pc.ScriptComponent;

    type Camera = {
        source : type.CameraSource | type.HTMLElementSource;
        cameraPoseMatrix : pc.Mat4;
        mirror : boolean;
        pipeline: type.Pipeline;
        canvas : HTMLCanvasElement,
        canvas_container : HTMLDivElement,
        gl : WebGLRenderingContext,
        'Front Facing Camera' : boolean;
        'Mirror Mode' : 'none' | 'poses' | 'css';
        'Camera Pose' : 'default' | 'anchor' | 'attitude';
    } & pc.ScriptComponent;


    type BrowserUtil = {
        'Compatibility Check' : boolean;
        'Mobile Only' : boolean;
    } & pc.ScriptComponent;

    type ZapparScreenshot = {
        mergeImages : (sources : {src: string}[], options? : any) => Promise<string>;
        postRender : () => void;
        needsCapture : boolean,
        // imageQuality : number,
        shareOptions : {
            shareButton: boolean,
            shareTitle: string,
            shareText: string,
            shareUrl: string,
            // downloadFileName: string,
        }
        localisation : {
            SAVE: string,
            SHARE: string,
            NowOpenFilesAppToShare: string,
            TapAndHoldToSave: string,
        }
        downloadOptions: {
            imageQuality: number,
            downloadFileName: string,
            imageFormat: string,
        }
    } & pc.ScriptComponent;

}

declare global {
    let Zappar: typeof type;
    let MobileOnly : typeof mobileOnly;
    namespace Z {
        namespace Type{
            type Camera = typeof pc.ScriptType & { prototype : Prototypes.Camera};
            type FaceMesh = typeof pc.ScriptType & { prototype : Prototypes.FaceMesh};
            type FaceTracker = typeof pc.ScriptType & { prototype : Prototypes.FaceTracker};
            type ImageTracker = typeof pc.ScriptType & { prototype : Prototypes.imageTracker};
            type FaceLandmark = typeof pc.ScriptType & { prototype : Prototypes.FaceLandmark};
            type InstantTracker = typeof pc.ScriptType & { prototype : Prototypes.instantTracker};
            type BrowserUtil = typeof pc.ScriptType & { prototype : Prototypes.BrowserUtil};
            type ZapparScreenshot = typeof pc.ScriptType & { prototype : Prototypes.ZapparScreenshot};
            type ZapparWebGLSnapshot = typeof ZapparWebGLSnapshot;
            namespace PC {
                type GraphicsDevice = pc.GraphicsDevice & {
                    gl : WebGLRenderingContext,
                    enabledAttributes : any,
                    textureUnits : any,
                    setViewport(x: number, y: number, w?: number, h?: number): void;
                    vx : number,
                    setUnpackFlipY : (flipY : boolean) => void;
                };
                type Asset<T> = T & {
                    resource : T
                }
            }
        }
    }
}
