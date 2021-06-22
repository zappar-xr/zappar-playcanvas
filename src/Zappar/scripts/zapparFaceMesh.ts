/* jshint esversion: 6 */

/**
 * Used for fitting to the user's face and deforms as the user's expression changes
 * @see https://docs.zap.works/universal-ar/javascript/face-tracking/
 */

const ZapparFaceMesh = pc.createScript('zapparFaceMesh') as Z.Type.FaceMesh;

ZapparFaceMesh.attributes.add('Face Tracker', { type: 'entity',  description: "Face Tracker (Drag from hierarchy)"  });
ZapparFaceMesh.attributes.add('Zappar Camera', { type: 'entity',  description: "Zappar Camera (Drag from hierarchy)" });


ZapparFaceMesh.attributes.add('Fill mouth', {
    type: 'boolean',
    default: false,
    description: "Mesh fills mouth"
});

ZapparFaceMesh.attributes.add('Fill eye (left)', {
    type: 'boolean',
    default: false,
    description: "Mesh fills eye"
});

ZapparFaceMesh.attributes.add('Fill eye (right)', {
    type: 'boolean',
    default: false,
    description: "Mesh fills eye"
});

ZapparFaceMesh.attributes.add('Mask', {
    type: 'boolean',
    default: false,
    description: "Occlude depth, do not render colors"
});

ZapparFaceMesh.attributes.add('Full Head', {
    type: 'boolean',
    default: false,
    description: "Use full head mesh?"
});

// Face Mask's material. If none is specified, mask is not used.
ZapparFaceMesh.attributes.add('material', {
    type: 'asset',
    assetType: 'material',
    description: 'The material that the mesh uses'
});



// initialize code called once per entity
ZapparFaceMesh.prototype.initialize = function () {
    if (!this['Zappar Camera']) throw new Error('Zappar Camera attribute undefined - Please link camera entity to attribute.');
    if (!this['Face Tracker']) throw new Error('Face Tracker attribute undefined - Please link face tracker entity to attribute.');

    /**
     * Constructs a new Face Mesh.
     * @see https://docs.zap.works/universal-ar/javascript/face-tracking/
    */
    this.ZfaceMesh = new Zappar.FaceMesh();


   /**
     * The full head simplified mesh covers the whole of the user's head, including some neck.
     * It's ideal for drawing into the depth buffer in order to mask out the back of 3D models placed on the user's head.
     * @param fillMouth - Should this feature of the mesh should be filled.
     * @param fillEyeLeft - Should this feature of the mesh should be filled.
     * @param fillEyeRight - Should this feature of the mesh should be filled.
     * @param fillNeck - Should this feature of the mesh should be filled
     * @returns A promise that's resolved once the model is loaded.
    */
    const FaceMesh = this["Full Head"] ? this.ZfaceMesh.loadDefaultFullHeadSimplified(this['Fill mouth'], this['Fill eye (left)'], this['Fill eye (right)']) : this.ZfaceMesh.loadDefaultFace(this['Fill mouth'], this['Fill eye (left)'], this['Fill eye (right)']);

    FaceMesh.then(() => {
        this.app.fire('zappar:face_mesh', { message: 'mesh_loaded'} );

        // Create a new node which is needed to create components.
        const node = new pc.GraphNode();
        // Create a new model which will store our face mesh.
        const model = new pc.Model();
        // Assign the node to the model.
        model.graph = node;
        // Create a new mesh using the vertices, normals and UVs provided by Zappar's face mesh.
        const mesh = pc.createMesh(this.app.graphicsDevice, Array.from(this.ZfaceMesh.vertices), {
            normals: Array.from(this.ZfaceMesh.normals),
            uvs: Array.from(this.ZfaceMesh.uvs),
        });

        // Create a new material from the one provided in script's attributes.
        let material : pc.Material; //TODO: Create material if not specified
        // Create a new instance of a mesh.

        // Add a model component.
        this.entity.removeComponent('model');
        this.entity.addComponent('model');

         if (this.Mask) {
            // Set the Occluder properties.
            let materialAsset = this.app.assets.find('Occluder');
            if (materialAsset) {
                material = materialAsset.resource;
                material.depthTest = true;
                material.depthWrite = true;
                material.blueWrite = false;
                material.redWrite = false;
                material.greenWrite = false;
                material.alphaWrite = false;
            } else {
                material = (this.material as Z.Type.PC.Asset<pc.Material>).resource;
                console.warn('Zappar: Missing "Occluder material');
            }
        } else {
            material = (this.material as Z.Type.PC.Asset<pc.Material>).resource;
        }

        const meshInstance = new pc.MeshInstance(mesh, material, node);
        // create new entity here
        // Push meshInstance to the model's mesh instances.
        model.meshInstances.push(meshInstance);

        // Assign our face mesh model to the entity.
        if (this.entity.model)
            this.entity.model.model = model;

        // Correct the rotation of the entity.
        this.entity.rotateLocal(0, 180, 0);
    });

    // Get refferences to the camera and face tracker.
    this.faceTracker = this['Face Tracker'].script.zapparFaceTracker.faceTracker;
    this.Camera = this['Zappar Camera'].script.zapparCamera;
};

// update code called every frame
ZapparFaceMesh.prototype.update = function () {

    // Update the face mesh from visible anchors.
    this.faceTracker.visible.forEach((anchor) => {

        /**
         * Update face mesh directly from a face anchor.
         * @param f - The face anchor.
         * @param mirror - Pass `true` to mirror the location in the X-axis.
         */
        this.ZfaceMesh.updateFromFaceAnchor(anchor);

        // Check if the model has mesh instances.
        if (this.entity.model && this.entity.model.meshInstances[0]) {
            // Update the model component's mesh to data provided by Zappar face mesh.
            const meshInstanceMesh = this.entity.model.meshInstances[0].mesh;
            meshInstanceMesh.setPositions(this.ZfaceMesh.vertices);
            meshInstanceMesh.setUvs(0, this.ZfaceMesh.uvs);
            meshInstanceMesh.setIndices(this.ZfaceMesh.indices);
            meshInstanceMesh.setNormals(this.ZfaceMesh.normals);

            // Instruct model's mesh to update.
            meshInstanceMesh.update();
        }
    });
};
