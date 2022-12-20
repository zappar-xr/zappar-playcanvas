/* jshint esversion: 6 */
const ZapparProbeSphere = pc.createScript('zapparProbeSphere') as Z.Type.probeSphere;

ZapparProbeSphere.attributes.add('Zappar Camera', {
    type: 'entity',
    description: "The Zappar Camera"
});



ZapparProbeSphere.prototype.initialize = function () {

    const sphereMaterial = new pc.BasicMaterial();

    if(!this['Zappar Camera']) return;

    const texture = this['Zappar Camera'].script.zapparCamera.texture;

    sphereMaterial.colorMap = texture;
    sphereMaterial.cull = pc.CULLFACE_NONE;

    if(this.entity.render) this.entity.render.material = sphereMaterial;

};
