/* jshint esversion: 6 */

/**
 * Used for generating a mesh for the preview image of an image target. This mesh fits to the target.
 * @see https://docs.zap.works/universal-ar/javascript/image-tracking/
 */

const ZapparImageTargetPreviewMesh = pc.createScript('zapparImageTargetPreviewMesh') as Z.Type.ZapparImageTargetPreviewMesh;

ZapparImageTargetPreviewMesh.attributes.add('Image Tracker', { type: 'entity',  description: "Image Tracker (Drag from hierarchy)"  });

ZapparImageTargetPreviewMesh.attributes.add('Target Index', {
    type: 'number',
    default: 0,
    description: "The index of the target to use for preview mesh",
});

// initialize code called once per entity
ZapparImageTargetPreviewMesh.prototype.initialize = function () {
    if (!this['Image Tracker']) throw new Error('Image Tracker attribute undefined - Please link image tracker entity to attribute.');
    this.initialized = false;
};

// update code called every frame
ZapparImageTargetPreviewMesh.prototype.update = function () {

    if (!this.initialized && this["Image Tracker"]) {
        const img = this["Image Tracker"].script.zapparImageTracker.imageTracker.targets[this["Target Index"]].image;
        if (!img) throw new Error(`Image target ${this["Target Index"]} has no preview image`);

        const mesh = new pc.Mesh(this.app.graphicsDevice);
        this.mesh = mesh;
        const positions = this["Image Tracker"].script.zapparImageTracker.imageTracker.targets[0].preview.vertices;
        const indexArray = this["Image Tracker"].script.zapparImageTracker.imageTracker.targets[0].preview.indices;

        mesh.setUvs(0, this["Image Tracker"].script.zapparImageTracker.imageTracker.targets[0].preview.uvs);
        mesh.setIndices(indexArray);
        mesh.setPositions(positions);
        // Convert float32Arr to number[]
        mesh.setNormals(pc.calculateNormals([].slice.call(positions),[].slice.call(indexArray)));

        mesh.update(pc.PRIMITIVE_TRIANGLES);


        const material = new pc.StandardMaterial();

        const meshInstance = new pc.MeshInstance(mesh, material);

        const entity = this.entity;
        entity.addComponent("render", {
            meshInstances: [meshInstance]
        });

        const asset = new pc.Asset("myTexture", "texture", {
            url: img.src
        });

        this.app.assets.add(asset);

        asset.on("error", console.error);

        asset.on("load", function (asset) {
            material.emissiveMap = asset.resource;
            material.emissiveMap!.flipY = true;
            material.useLighting = false;
            material.update();
        });

        this.app.assets.load(asset);
        this.entity.rotateLocal(-90, 0, 0);
        this.initialized = true;
    }
};
