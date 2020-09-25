import * as THREE from 'three';

export class TerrainTile {
  constructor(width, height, overlap, elevationData, textureData, coordX = 0, coordY = 0) {
    this.width = width;
    this.height = height;
    this.overlap = overlap;
    this.elevationData = elevationData;
    this.textureData = textureData;
    this.coordX = coordX;
    this.coordY = coordY;
  }

  async createMesh() {
    this.geometry = new THREE.PlaneBufferGeometry(
      this.width + this.overlap,
      this.height + this.overlap,
      this.width - 1 + this.overlap,
      this.height - 1 + this.overlap,
    );
    this.geometry.rotateX(-Math.PI / 2);
    this.setElevationVertices();
    this.texture = new THREE.CanvasTexture(
      this.generateTexture(this.textureData, this.width + this.overlap, this.height + this.overlap),
    );
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshBasicMaterial({ map: this.texture }));
    this.mesh.onAfterRender = this.disposeAttributes;
  }

  setElevationVertices(stretchVertical = 1) {
    for (let i = 0, j = 0, l = this.geometry.attributes.position.array.length; i < l; i++, j += 3) {
      this.geometry.attributes.position.array[j + 1] = this.elevationData[i] * stretchVertical;
    }
    if (this.mesh) {
      this.mesh.geometry.attributes.position.needsUpdate = true;
    }
    this.elevationData = null;
  }

  generateTexture(data, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const imageData = image.data;

    for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
      imageData[i] = data[3 * j];
      imageData[i + 1] = data[3 * j + 1];
      imageData[i + 2] = data[3 * j + 2];
    }

    context.putImageData(image, 0, 0);
    this.textureData = null;
    return canvas;
  }

  addToScene(scene) {
    this.mesh.position.set((this.coordX + 0.5) * this.width, 0, (this.coordY + 0.5) * this.height);
    scene.add(this.mesh);
  }

  clear() {
    this.geometry = null;
    this.texture = null;
    this.mesh = null;
  }

  disposeAttributes(renderer, scene, camera, geometry, material, group) {
    geometry.getAttribute('position').array = [];
    geometry.getAttribute('normal').array = [];
    geometry.getAttribute('uv').array = [];
  }
}
