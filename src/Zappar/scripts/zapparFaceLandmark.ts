/* jshint esversion: 6 */

/**
 * Attaches content to a known point (landmark) on a face as it moves around in the camera view.
 * Landmarks will remain accurate, even as the user's expression changes.
 * @see https://docs.zap.works/universal-ar/javascript/face-tracking/
 */

const ZapparFaceLandmark = pc.createScript('zapparFaceLandmark') as Z.Type.FaceLandmark;

ZapparFaceLandmark.attributes.add('Landmark Target', {
    type: 'string',
    enum: [
        { 'Eye (Left)': 'EYE_LEFT' },
        { 'Eye (Right)': 'EYE_RIGHT' },
        { 'Ear (Left)': 'EAR_LEFT' },
        { 'Ear (Right)': 'EAR_RIGHT' },
        { 'Nose (Bridge)': 'NOSE_BRIDGE' },
        { 'Nose (Tip)': 'NOSE_TIP' },
        { 'Nose (Base)': 'NOSE_BASE' },
        { 'Lip (Top)': 'LIP_TOP' },
        { 'Lip (Bottom)': 'LIP_BOTTOM' },
        { 'Mouth (Center)': 'MOUTH_CENTER' },
        { Chin: 'CHIN' },
        { 'Eyebrow (Left)': 'EYEBROW_LEFT' },
        { 'Eyebrow (Right)': 'EYEBROW_RIGHT' },
    ],
    default: 'none',
    description: "Which face feature the landmark should track to"
});

ZapparFaceLandmark.attributes.add('Face Tracker', { type: 'entity',  description: "Face Tracker (Drag from hierarchy)" }, );
ZapparFaceLandmark.attributes.add('Zappar Camera', { type: 'entity', description: "Zappar Camera (Drag from hierarchy)" });

// initialize code called once per entity
ZapparFaceLandmark.prototype.initialize = function () {
    // Get a reference to landmark name attribute.
    const currentLandmarkName = Zappar.FaceLandmarkName[this['Landmark Target']];

    /**
     * Constructs a new Face Lanmdmark.
     * @param _name - The name of the landmark to track.
     * @see https://docs.zap.works/universal-ar/javascript/face-tracking/
    */
    this.faceLandmark = new Zappar.FaceLandmark(currentLandmarkName);
};

// update code called every frame
ZapparFaceLandmark.prototype.update = function () {
    if (!this['Zappar Camera']) throw new Error('Zappar Camera attribute undefined - Please link camera entity to attribute.');
    if (!this['Face Tracker']) throw new Error('Face Tracker attribute undefined - Please link face tracker entity to attribute.');

    // Get refference to Face Tracker.
    const { faceTracker } = this['Face Tracker'].script.zapparFaceTracker;

    // Get refference to Zappar Camera.
    const Camera = this['Zappar Camera'].script.zapparCamera;

    const { pipeline } = Camera;

    // Get pose and mirror attribute values.
    const currentPoseMode = Camera['Camera Pose'];
    const currentMirrorMode = Camera['Mirror Mode'];

    const mirrorPoses = currentMirrorMode === 'poses';

    /**
     * Returns a transformation where the camera sits, stationary, at the origin of world space, and points down the negative Z axis.
     *
     * In this mode, tracked anchors move in world space as the user moves the device or tracked objects in the real world.
     *
     * @returns A 4x4 column-major transformation matrix
    */
    let cameraPose = pipeline.cameraPoseDefault();

    switch (currentPoseMode) {
    case 'attitude': {
        /**
         * Returns a transformation where the camera sits at the origin of world space, but rotates as the user rotates the physical device.
         *
         * When the Zappar library initializes, the negative Z axis of world space points forward in front of the user.
         *
         * In this mode, tracked anchors move in world space as the user moves the device or tracked objects in the real world.
         *
         * @param mirror -  Pass `true` to mirror the location in the X-axis.
         * @returns A 4x4 column-major transformation matrix
        */
        cameraPose = pipeline.cameraPoseWithAttitude(mirrorPoses);
        break;
    }
    case 'anchor': {
        const anchor = faceTracker.anchors.values().next().value;
        if (anchor) {
        /**
             * Returns a transformation with the (camera-relative) origin specified by the supplied parameter.
             *
             * This is used with the `poseCameraRelative(...) : Float32Array` functions provided by the various anchor types to allow a given anchor (e.g. a tracked image or face) to be the origin of world space.
             *
             * In this case the camera moves and rotates in world space around the anchor at the origin.
             *
             * @param o - The origin matrix.
             * @returns A 4x4 column-major transformation matrix
            */
            cameraPose = pipeline.cameraPoseWithOrigin(
                /**
                 * Returns the pose of the anchor relative to the camera.
                 * @param mirror - Pass `true` to mirror the location in the X-axis.
                 * @returns A 4x4 column-major transformation matrix.
                 */
                anchor.poseCameraRelative(mirrorPoses),
            );
        }
        break;
    }
    default: // Continue
    }
    // Update landmarks from visible anchors.
    faceTracker.visible.forEach((anchor) => {
        // Create a PC matrix 4 from the anchor pose.
        const pose = new pc.Mat4().set(Array.from(anchor.pose(cameraPose, mirrorPoses)));

        /**
         * Updates Face Landmark directly from a face anchor.
         * @param f - The face anchor.
         * @param mirror - Pass `true` to mirror the location in the X-axis.
        */
        this.faceLandmark.updateFromFaceAnchor(anchor, mirrorPoses);

        // modelViewProjection * vertexPosition;
        const result = pose.mul(new pc.Mat4().set(Array.from(this.faceLandmark.pose)));

        // Set rotation of the entity.
        this.entity.setEulerAngles(
            result.getEulerAngles().x,
            result.getEulerAngles().y,
            result.getEulerAngles().z,
        );

        // Set position of the entity.
        this.entity.setPosition(result.getTranslation());
    });
};
