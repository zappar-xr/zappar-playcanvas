/* jshint esversion: 6 */
/**
 * Attaches content to a known image as it moves around in the camera view.
 * @see https://docs.zap.works/universal-ar/javascript/image-tracking/
 */


const zapparImageTracker = pc.createScript('zapparImageTracker') as Z.Type.ImageTracker;

// Input for a .zpt target file.
zapparImageTracker.attributes.add('Target Image', {
    type: 'asset',
    assetType: 'binary',
    description: 'Image Target file (.zpt) '
});

// Display content upright by rotating X by 90.
zapparImageTracker.attributes.add('Target Upright', {
    type: 'boolean',
    default: true,
    description: 'Offset rotations for upright targets'
});

zapparImageTracker.attributes.add('Zappar Camera', { type: 'entity', description: "Zappar Camera (Drag from hierarchy)" });

// initialize code called once per entity
zapparImageTracker.prototype.initialize = function () {
    if (!this['Zappar Camera']) throw new Error('Zappar Camera attribute undefined - Please link camera entity to attribute.');
    // Get refference to Zappar Camera.

    this.Camera = this['Zappar Camera'].script.zapparCamera;

    this.pipeline = this.Camera.pipeline;

    /**
     * Constructs a new ImageTracker
     * @param _pipeline - The pipeline that this tracker will operate within.
     * @param targetFile - The .zpt target file from the source image you'd like to track.
     * @see https://docs.zap.works/universal-ar/zapworks-cli/
    */
    this.imageTracker = new Zappar.ImageTracker(this.pipeline);

    this.imageTracker.onNewAnchor.bind((anchor) => {
        this.app.fire('zappar:image_tracker', { message : 'new_anchor', anchor });
    });

    /**
    * Emitted when an anchor becomes visible in a camera frame.
    */
    this.imageTracker.onVisible.bind((anchor) => {
         this.app.fire('zappar:image_tracker', { message : 'anchor_visible', anchor });
    });

    /**
    * Emitted when an anchor goes from being visible in the previous camera frame, to not being visible in the current frame.
    */
    this.imageTracker.onNotVisible.bind((anchor) => {
         this.app.fire('zappar:image_tracker', { message : 'anchor_not_visible', anchor });
    });

    // If .zpt is not provided, throw an error.
    if (!this['Target Image']) throw new Error('No target image found in entity assets');

    // Load the target image into the image tracker.
    const target = this['Target Image'].resource;

    /**
     * Loads a target file.
     * @param src - The target file from the source image you'd like to track.
     * @see https://docs.zap.works/universal-ar/zapworks-cli/
     * @returns A promise that's resolved once the file is downloaded. It may still take a few frames for the tracker to fully initialize and detect images.
    */
    this.imageTracker.loadTarget(target).then(()=>{
        this.app.fire('zappar:image_tracker', { message : 'target_loaded'});
    });
};

zapparImageTracker.prototype.update = function () {
    // If target upright has been enabled, set our offset X to 90.
    const offset = this['Target Upright'] ? 90 : 0;

    // Loop through all visible anchors.
    this.imageTracker.visible.forEach((anchor) => {
        // Create an anchor pose matrix from the anchor's pose and
        // mirror it if the user has selected mirroring options.
        const { cameraPoseMatrix } = this.Camera;

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
