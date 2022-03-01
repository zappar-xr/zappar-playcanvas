/* jshint esversion: 6 */
const ZapparCamera = pc.createScript('zapparCamera') as Z.Type.Camera;
const DEBUG = location.href.indexOf("https://launch.playcanvas.com/1043910") !== -1; //!TESTS

if (DEBUG) Zappar.setLogLevel( DEBUG? Zappar.LogLevel.LOG_LEVEL_VERBOSE : Zappar.LogLevel.LOG_LEVEL_WARNING ); //!TESTS


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
    this.canvas = this.app.graphicsDevice.canvas;
    this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl')!;

    // Check if graphics device has webgl.
    if (!this.gl) throw new Error('no gl');

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
    this.pipeline.glContextSet(this.gl);

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

    this.initializeBackground();
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
            this.canvas.style.transform = '';
            break;
        case 'poses':
            this.mirror = true;
            this.canvas.style.transform = '';
            break;
        case 'css':
            this.mirror = false;
            this.canvas.style.transform = 'scaleX(-1)';
            break;
        default:
            throw new Error('Unknown mirror type');
    }


    this.pipeline.processGL();

    // Update to using the latest tracking frame data
    this.pipeline.frameUpdate();

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
    const camera = this.entity.camera;

    if (camera) {
        camera.calculateProjection = (mat) => {
            mat.copy(projectionMatrix);
            const data = projectionMatrix.data;
            camera.horizontalFov = false;
            camera.fov = (2.0 * Math.atan(1.0 / data[5]) * 180.0) / Math.PI;
            camera.aspectRatio = data[5] / data[0];
            camera.farClip = data[14] / (data[10] + 1);
            camera.nearClip = data[14] / (data[10] - 1);
        };
        this.updateBackgroundTexture(this.pipeline);
    }
};



ZapparCamera.prototype.initializeBackground = function() {
    this.backgroundPlane = new pc.Entity();
    this.backgroundPlane.addComponent("render", {
        type: 'plane',
    });

    this.backgroundPlane.setLocalEulerAngles(-90, 0, 0);

    this.entity.addChild(this.backgroundPlane);

    this.texture = new pc.Texture(this.app.graphicsDevice, {
        format: pc.PIXELFORMAT_R8_G8_B8
    });

    this.material = new pc.Material();
    this.material.cull = pc.CULLFACE_FRONT;

    this.backgroundPlane.render!.material = this.material;

    const shaderDefinition = {
        attributes: {
            position: pc.SEMANTIC_POSITION,
            texcoord: pc.SEMANTIC_TEXCOORD0
        },
        vshader: `
            precision highp float;
            attribute vec3 position;
            attribute vec2 texcoord;
            uniform mat4 texTransform;

            uniform mat4 matrix_model;
            uniform mat4 matrix_viewProjection;

            varying vec2 uv;

            void main(void)
            {
                uv = (texTransform * vec4(texcoord.xy, 0., 1.)).xy;

                gl_Position = matrix_viewProjection * matrix_model * vec4(position, 1.0);
            }`,
        fshader: `
            precision highp float;
            varying vec2 uv;
            uniform sampler2D uCameraTexture;

            void main(void)
            {
                vec4 color = texture2D(uCameraTexture, uv);
                gl_FragColor = color;
            }`
    };

    const shader = new pc.Shader(this.app.graphicsDevice, shaderDefinition);

    this.material.shader = shader;
    this.material.setParameter('uCameraTexture', this.texture);
};


ZapparCamera.prototype.updateBackgroundTexture = function (pipeline) {
    const { aspectRatio, fov, farClip } = this.entity.camera as pc.CameraComponent;
    this.backgroundPlane.setPosition(0, 0, -(farClip - Number.MIN_VALUE));

    const dist = this.backgroundPlane.getPosition().length();
    const angRad = fov * Math.PI / 180;
    const y = dist * Math.tan(angRad / 2) * 2;
    const x = y * aspectRatio;

    this.backgroundPlane.setLocalScale(x, 1, y);

    this.texture._glTexture = pipeline.cameraFrameTextureGL();
    const mat = pipeline.cameraFrameTextureMatrix(this.app.graphicsDevice.width, this.app.graphicsDevice.height, this.mirror);
    this.material.setParameter('texTransform', mat as any);
};
