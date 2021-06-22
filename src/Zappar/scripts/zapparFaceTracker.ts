/* jshint esversion: 6 */
const ZapparFaceTracker = pc.createScript('zapparFaceTracker') as Z.Type.FaceTracker;

/**
 * Attaches content to a face as it moves around in the camera view.
 * @see https://docs.zap.works/universal-ar/javascript/face-tracking/
 */

// Input for max number of faces to track.
ZapparFaceTracker.attributes.add('Max Faces', {
    type: 'number',
    default: 1,
    description: 'The maximum number of faces the tracker will look for'
});
// Display content upright by rotating X by 90.
ZapparFaceTracker.attributes.add('Target Upright', {
    type: 'boolean',
    default: true,
    description: 'Offset rotations for upright targets'
});

ZapparFaceTracker.attributes.add('Zappar Camera', { type: 'entity',  description: "Zappar Camera (Drag from hierarchy)" });

ZapparFaceTracker.prototype.initialize = function () {
    if (!this['Zappar Camera']) throw new Error('Zappar Camera attribute undefined - Please link camera entity to attribute.');

    // Get refference to Zappar Camera.
    this.Camera = this['Zappar Camera'].script.zapparCamera;

    /**
     * Constructs a new FaceTracker
     * @param _pipeline - The pipeline that this tracker will operate within.
    */
    this.faceTracker = new Zappar.FaceTracker(this.Camera.pipeline);

    /**
     * Loads the default face tracking model.
     * @returns A promise that's resolved once the model is loaded.
    */
    this.faceTracker.loadDefaultModel().then(() => {
        this.app.fire('zappar:face_tracker', { message : 'model_loaded' });
    });

    /**
    * Emitted when a new anchor is created by the tracker.
    */
    this.faceTracker.onNewAnchor.bind((anchor) => {
        this.app.fire('zappar:face_tracker', { message : 'new_anchor', anchor });
    });

    /**
    * Emitted when an anchor becomes visible in a camera frame.
    */
    this.faceTracker.onVisible.bind((anchor) => {
         this.app.fire('zappar:face_tracker', { message : 'anchor_visible', anchor });
    });

    /**
    * Emitted when an anchor goes from being visible in the previous camera frame, to not being visible in the current frame.
    */
    this.faceTracker.onNotVisible.bind((anchor) => {
         this.app.fire('zappar:face_tracker', { message : 'anchor_not_visible', anchor });
    });

   /**
    * The maximum number of faces to track.
    */
    this.faceTracker.maxFaces = this['Max Faces'];
};

// update code called every frame
ZapparFaceTracker.prototype.update = function () {
    // Grab the global camera pose from Zappar Camera script.
    const { cameraPoseMatrix } = this.Camera;

    // If target upright has been enabled, set our offset X to 90.
    const offset = this['Target Upright'] ? 90 : 0;

    // Loop through all visible face anchors.
    this.faceTracker.visible.forEach((anchor) => {
        // Create an anchor pose matrix from the anchor's pose and
        // mirror it if the user has selected mirroring options.
        const anchorPoseArray = Array.from(
            /**
             * Returns the world pose for the anchor for a given camera location.
             * @param cameraPose - The location of the camera as a 4x4 column-major matrix.
             * @param mirror - Pass `true` to mirror the location in the X-axis.
             * @returns A 4x4 column-major transformation matrix.
             */
            anchor.pose(cameraPoseMatrix.data, this.Camera.mirror)
        );

        const anchorPoseMatrix = new pc.Mat4().set(anchorPoseArray);

        // Update the entity's rotation.
        this.entity.setEulerAngles(
            anchorPoseMatrix.getEulerAngles().x + offset,
            anchorPoseMatrix.getEulerAngles().y,
            anchorPoseMatrix.getEulerAngles().z,
        );

        // Update the entity's position.
        this.entity.setPosition(anchorPoseMatrix.getTranslation());
    });
};
