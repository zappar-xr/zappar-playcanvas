/* jshint esversion: 6 */
/**
 * Attaches content to a point on a surface in front of the user as it moves around in the camera view.
 * @see https://docs.zap.works/universal-ar/javascript/instant-world-tracking/
 */

const zapparInstantTracker = pc.createScript('zapparInstantTracker') as Z.Type.InstantTracker;

zapparInstantTracker.attributes.add('Placement Button', {
    type: 'entity',
    description: 'Button which locks tracking state'
});

zapparInstantTracker.attributes.add('Anchor Camera Offset', {
    type: 'number',
    default: [0, 0, -5],
    array: true,
    description: 'Offset the target by this vector while its camera anchored'
});



zapparInstantTracker.attributes.add('Zappar Camera', { type: 'entity', description: "Zappar Camera (Drag from hierarchy)" });

// initialize code called once per entity
zapparInstantTracker.prototype.initialize = function () {
    // Instant tracker needs access to the camera script
    if (!this['Zappar Camera']) throw new Error('Zappar Camera attribute undefined - Please link camera entity to attribute.');

    // Get refference to Zappar Camera.
    this.Camera = this['Zappar Camera'].script.zapparCamera;
    this.pipeline = this.Camera.pipeline;

    // placement button provided in attributes
    const placementButton = this['Placement Button'];

    // 'Locks' the anchor in place.
    const lockAnchor = () => {
       this.hasPlaced = true;
    }

    // 'Unlocks' the anchor. (placement mode)
    const unlockAnchor = () => {
        this.hasPlaced = false;
    }

    // Inverts the placement mode state.
    const toggleLockState = () => {
        this.hasPlaced = !this.hasPlaced;
    }

    /**
     * There's two built-in options for setting the placement mode:
     *  1 - PlayCanvas Events
     *  2 - Button Element.
    */


    /**
     * * Playcanvas Events
     * To lock the tracking state:
     *     this.app.fire('zappar:instant_tracker' {message: 'placement_mode', true });
     * To unlock the tracking state:
     *     this.app.fire('zappar:instant_tracker' {message: 'placement_mode', false });
    */
    this.app.on('zappar:instant_tracker',(ev)=> {
        const {message, placementMode} = ev;
        if(message === 'placement_mode') {
            const action = placementMode ? unlockAnchor : lockAnchor;
            action();
        }
    });


    /**
     * * Button Element
     * If a button is provided as an entity attribute, users input will toggle the lock state.
    */
    if (placementButton && placementButton.element){
        // Apply touch and click handlers if a button has been provided.
        placementButton.element.on('mousedown', toggleLockState, this);
        placementButton.element.on('touchstart', toggleLockState, this);
    }

    /**
     * Constructs a new Instant World Tracker.
     * @param _pipeline - The pipeline that this tracker will operate within.
    */
    this.instantTracker = new Zappar.InstantWorldTracker(this.pipeline);
};


zapparInstantTracker.prototype.update = function () {

    // Get the offset attribute.
    const anchorPoseFromCameraOffset = this['Anchor Camera Offset'];

    if (!this.hasPlaced) {
        /**
         * the point in the user's environment that the anchor tracks from.
         * The parameters passed in to this function correspond to the X, Y and Z coordinates (in camera space) of the point to track. Choosing a position with X and Y coordinates of zero, and a negative Z coordinate, will select a point on a surface directly in front of the center of the screen.
         * @param orientation -  The instant world tracker transform origin.
         */
        this.instantTracker.setAnchorPoseFromCameraOffset(...anchorPoseFromCameraOffset);
    }

    // Create an anchor pose matrix from the anchor's pose and
    // mirror it if the user has selected mirroring options.
    const { cameraPoseMatrix } = this.Camera;
    const { anchor } = this.instantTracker;

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
        anchorPoseMatrix.getEulerAngles().x,
        anchorPoseMatrix.getEulerAngles().y,
        anchorPoseMatrix.getEulerAngles().z,
    );

    // Update the entity's position.
    this.entity.setPosition(anchorPoseMatrix.getTranslation());
};
