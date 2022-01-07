/* jshint esversion: 6 */
const ZapparCamera = pc.createScript('zapparCamera') as Z.Type.Camera;
const DEBUG = location.href.indexOf("https://launch.playcanvas.com/1043910") !== -1; //!TESTS
Zappar.setLogLevel( DEBUG? Zappar.LogLevel.LOG_LEVEL_VERBOSE : Zappar.LogLevel.LOG_LEVEL_WARNING ); //!TESTS


// Script attributes for camera customization.
ZapparCamera.attributes.add('Front Facing Camera', {
    type: 'boolean',
    default: false,
    description: "Should front camera be used"
});

ZapparCamera.attributes.add('Mirror Mode', {
    type: 'string',
    enum: [{
        None: 'none',
    },
    {
        CSS: 'css',
    },
    {
        Poses: 'poses',
    },
    ],
    default: 'none',
    description: 'How the scene and camera is mirrored/flipped'
});

ZapparCamera.attributes.add('Camera Pose', {
    type: 'string',
    enum: [{
        Default: 'default',
    },
    {
        Anchor: 'anchor',
    },
    {
        Attitude: 'attitude',
    },
    ],
    default: 'default',
    description: 'Pose mode of the tracked content'
});

// initialize code called once per entity
ZapparCamera.prototype.initialize = function () {
    // Create a canvas where the camera source will be rendered.
    const canvas = document.createElement('canvas');
    // Get refference to PC Canvas.
    const PC_canvas = document.querySelector('canvas') as HTMLCanvasElement;

    // Create a container which will store both canvas elements.
    const canvas_container = document.createElement('div');
    document.body.appendChild(canvas_container);

    // Append both canvas elements to the container.
    // This will be used to CSS mirror.
    canvas_container.appendChild(canvas);
    canvas_container.appendChild(PC_canvas);

    // Style ZapparCanvas to fit screen.
    canvas.id = 'ZapparCanvas';
    canvas.style.height = '100%';
    canvas.style.width = '100%';
    canvas.style.margin = '0px';

    canvas.width = PC_canvas.clientWidth;
    canvas.height = PC_canvas.clientHeight;

    // Copy PC canvas dimensions on resize.
    window.addEventListener("resize", () => {
        canvas.width = PC_canvas.clientWidth;
        canvas.height = PC_canvas.clientHeight;
    });

    // Get ZapparCanvas context.
    const gl = canvas.getContext('webgl');

    // Check if graphics device has webgl.
    if (!gl) throw new Error('no gl');

    // Export objects which we'll use in update.
    this.gl = gl;
    this.canvas_container = canvas_container;
    this.canvas = canvas;

    // These will be used by trackers
    this.cameraPoseMatrix = new pc.Mat4();
    this.mirror = false;

    /**
     * Pipelines manage the flow of data coming in (i.e. the camera frames) through to the output from the different tracking types and computer vision algorithms.
     * @see https://docs.zap.works/universal-ar/javascript/pipelines-and-camera-processing/
     */
    ZapparCamera.prototype.pipeline = new Zappar.Pipeline();

    /**
     * Sets the WebGL context used for the processing and upload of camera textures.
     * @param gl - The WebGL context.
    */
    this.pipeline.glContextSet(gl);

    const getActiveSource = () => this['Front Facing Camera'] ? ZapparCamera.prototype.source.user : ZapparCamera.prototype.source.rear;


    this.app.on('zappar:camera',(ev)=> {
        const {message, userFacing} = ev;
        if (message === 'flip') {
            if (userFacing === undefined){
                this['Front Facing Camera'] = !this['Front Facing Camera'];
                getActiveSource().start();
            } else {
                this['Front Facing Camera'] = userFacing;
                getActiveSource().start();
            }
        }
    });

    if(DEBUG){ //!TESTS
        let imgUrl = "https://scenefiles.s3.amazonaws.com/uar-dev/face.png"; //!TESTS
        let img = document.createElement("img"); //!TESTS
        img.src = imgUrl; //!TESTS
        img.crossOrigin = "anonymous"; //!TESTS

       img.onload = () => { //!TESTS
            ZapparCamera.prototype.source = { //!TESTS
                user : new Zappar.HTMLElementSource(this.pipeline, img), //!TESTS
                rear : new Zappar.HTMLElementSource(this.pipeline, img) //!TESTS
            } //!TESTS
            ZapparCamera.prototype.source.user.start(); //!TESTS
        } //!TESTS

    } else { //!TESTS
        /**
         * Constructs a new CameraSource.
         * @param _pipeline - The pipeline that this tracker will operate within.
         * @param deviceId - The camera device id which will be used as the source.
         * @see https://docs.zap.works/universal-ar/javascript/pipelines-and-camera-processing/
        */
        ZapparCamera.prototype.source = {
            user : new Zappar.CameraSource(this.pipeline, Zappar.cameraDefaultDeviceID(true)),
            rear : new Zappar.CameraSource(this.pipeline, Zappar.cameraDefaultDeviceID(false)),
        }
        /**
         * Shows Zappar's built-in UI to request camera permissions
         * @returns A promise containing granted status.
         * @see https://docs.zap.works/universal-ar/javascript/pipelines-and-camera-processing/
        */
        Zappar.permissionRequestUI().then((granted) => {
            this.app.fire('zappar:camera', {message : 'permission_granted', granted});
            if (granted){
                /**
                * Starts the camera source.
                */
                getActiveSource().start();
            } else {
                /**
                 * Shows Zappar's built-in permission denied UI.
                */
                Zappar.permissionDeniedUI();
            }
        });
    } //!TESTS

    // Pause and resume the camera source based on the visibility status of the page.
    document.addEventListener('visibilitychange', () => {
        const cameraSource = getActiveSource();
        switch (document.visibilityState) {
            case 'hidden':
                /**
                * Pauses the camera source.
                */
                cameraSource.pause();
                break;
            case 'visible':
            default:
                /**
                * Starts the camera source.
                */
                cameraSource.start();
                break;
        }
    });
};



// update code called every frame
ZapparCamera.prototype.update = function () {
    if (!this.pipeline || !this.app.autoRender) return;

    /**
     * Updates the pipeline and trackers to expose tracking data from the most recently processed camera frame.
     */
    this.pipeline.frameUpdate();

    /**
     * Returns a transformation where the camera sits, stationary, at the origin of world space, and points down the negative Z axis.
     *
     * In this mode, tracked anchors move in world space as the user moves the device or tracked objects in the real world.
     *
     * @returns A 4x4 column-major transformation matrix
    */
    const cameraPoseArray = Array.from(this.pipeline.cameraPoseDefault());

    // Set our global variable to share camera settings with the tracker.
    this.cameraPoseMatrix.set(cameraPoseArray); // this['Camera Pose']

    // Grab the dimensions of the ZapparCanvas.
    const { width, height } = this.canvas;

    // Apply mirroring settings to the camera based on user's input.
    switch (this['Mirror Mode']) {
        case 'none':
            this.mirror = false;
            this.canvas_container.style.transform = '';
            break;
        case 'poses':
            this.mirror = true;
            this.canvas_container.style.transform = '';
            break;
        case 'css':
            this.mirror = false;
            this.canvas_container.style.transform = 'scaleX(-1)';
            break;
        default:
            throw new Error('Unknown mirror type');
    }

     /**
     * Draw the camera to the screen as a full screen quad.
     *
     * Please note this function modifies some GL state during its operation so you may need to reset the following GL state if you use it:
     * - The currently bound texture 2D is set to `null` (e.g. `gl.bindTexture(gl.TEXTURE_2D, null)`)
     * - The currently bound array buffer is set to `null` (e.g. `gl.bindBuffer(gl.ARRAY_BUFFER, null);`)
     * - The currently bound program is set to `null` (e.g. `gl.useProgram(null)`)
     * - The currently active texture is set to `gl.TEXTURE0` (e.g. `gl.activeTexture(gl.TEXTURE0)`)
     * - These features are disabled: `gl.SCISSOR_TEST`, `gl.DEPTH_TEST`, `gl.BLEND`, `gl.CULL_FACE`
     * @param renderWidth - The width of the canvas.
     * @param renderHeight - The height of the canvas.
     * @param mirror - Pass `true` to mirror the camera image in the X-axis.
    */
    this.pipeline.cameraFrameDrawGL(width, height, this.mirror);


    /**
     * Prepares camera frames for processing.
     *
     * Call this function on your pipeline once an animation frame (e.g. during your `requestAnimationFrame` function) in order to process incoming camera frames.
     *
     * Please note this function modifies some GL state during its operation so you may need to reset the following GL state if you use it:
     * - The currently bound framebuffer is set to `null` (e.g. `gl.bindFramebuffer(gl.FRAMEBUFFER, null)`)
     * - The currently bound texture 2D is set to `null` (e.g. `gl.bindTexture(gl.TEXTURE_2D, null)`)
     * - The currently bound array buffer is set to `null` (e.g. `gl.bindBuffer(gl.ARRAY_BUFFER, null);`)
     * - The currently bound element array buffer is set to `null` (e.g. `gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)`)
     * - The currently bound program is set to `null` (e.g. `gl.useProgram(null)`)
     * - The currently active texture is set to `gl.TEXTURE0` (e.g. `gl.activeTexture(gl.TEXTURE0)`)
     * - These features are disabled: `gl.SCISSOR_TEST`, `gl.DEPTH_TEST`, `gl.BLEND`, `gl.CULL_FACE`
     * - The pixel store flip-Y mode is disabled (e.g. `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)`)
     * - The viewport is changed (e.g. `gl.viewport(...)`)
     * - The clear color is changed (e.g. `gl.clearColor(...)`)
    */
    this.pipeline.processGL();

    // Adjust viewport to fit screen.
    this.gl.viewport(0, 0, width, height);

    /**
     * Uploads the current camera frame to a WebGL texture.
    */
    this.pipeline.cameraFrameUploadGL();


    /**
     * Returns the camera model (i.e. the intrinsic camera parameters) for the current frame.
    */
    const model = this.pipeline.cameraModel();

    /**
     * Returns the projection matrix from a camera model / dimensions.
     * @param model - The camera model.
     * @param width - The width of the canvas.
     * @param height - The height of the canvas.
    */
    const projectionMatrixArray = Array.from(Zappar.projectionMatrixFromCameraModel(model, width, height));
    const projectionMatrix = new pc.Mat4().set(projectionMatrixArray);

    /**
     * Override default camera's projection matrix with one provided by Zappar.
    */
    if (this.entity.camera) {
        this.entity.camera.calculateProjection = (mat) => {
            mat.copy(projectionMatrix);
        };
    }
};
