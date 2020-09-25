import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { TilePromise } from './TilePromise';

function difference(setA, setB) {
  let _difference = new Set(setA);
  for (let elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}

function intersection(setA, setB) {
  let _intersection = new Set();
  for (let elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem);
    }
  }
  return _intersection;
}

export class TerrainMap {
  constructor(container, width, height, tileFetchingFunction, tileSizeX = 256, tileSizeY = 256) {
    this.container = container;
    this.setDimensions(width, height);
    this.tileFetchingFunction = tileFetchingFunction;
    this.TILE_SIZE_X = tileSizeX;
    this.TILE_SIZE_Y = tileSizeY;
    this.backgroundColor = 0x000000;
    this.tiles = [];
    this.tilegrid = {};
    this.maxAltitudePixel = 0;
    this.verticalStretch = 1;
    this.fps = 1;
    this._plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._raycaster = new THREE.Raycaster();
    this._cameraVector = new THREE.Vector2(1, 1);
    this._target = new THREE.Vector3();
    this.MAX_DISTANCE = 15 * this.TILE_SIZE_X;
  }

  setDimensions(width, height) {
    this.width = width;
    this.height = height;
  }

  setBackgroundColor(color) {
    this.backgroundColor = color;
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.backgroundColor);
    const aspectRatio = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(60, aspectRatio, 1, 10000);
    this.camera.position.x = 0;
    this.camera.position.y = 500; //must be non-zero so we see some tiles
    this.camera.position.z = 0;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  addTile(tile, maxAltitudePixel) {
    if (maxAltitudePixel > this.maxAltitudePixel) {
      this.maxAltitudePixel = maxAltitudePixel;
      this.controls.maxDistance = this.maxAltitudePixel + 800;
    }
    this.tiles.push(tile);
    tile.addToScene(this.scene);
    this.renderer.compile(this.scene, this.camera);
    this.update();
  }

  createControls() {
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.3;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 0.5 * this.height;
    this.controls.maxPolarAngle = 0.35 * Math.PI;
    this.controls.panSpeed = 0.5;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 1.5;
    this.controls.addEventListener('change', this.onControlsChange);
  }

  onControlsChange = () => {
    this.update();
    this.handleTilesInView();
  };

  render() {
    this.createScene();
    this.renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    this.renderer.setSize(this.width, this.height);
    this.createControls();
    this.update();
    this.fetchTilesIfNecessary();
  }

  update = () => {
    if (!this.updateTimeout) {
      this.updateTimeout = setTimeout(() => {
        this.updateTimeout = null;
        this.renderer.render(this.scene, this.camera);
      }, 1000 / 60);
    }
  };

  handleTilesInView = () => {
    if (!this.fetchTimeout) {
      this.fetchTimeout = setTimeout(() => {
        this.fetchTimeout = null;
        this.fetchTilesIfNecessary();
      }, 2);
    }
  };

  append() {
    this.container.appendChild(this.renderer.domElement);
  }

  stretchVertical = factor => {
    this.verticalStretch = factor;
    for (let tile of this.tiles) {
      tile.setElevationVertices(factor);
    }
  };

  fetchTilesIfNecessary = () => {
    const tilesToFetch = this.calculateTilesInView();

    const tilesToFetchIds = new Set(Object.keys(tilesToFetch));
    const allTilesIds = new Set(Object.keys(this.tilegrid));

    const newTilesToFetch = Array.from(difference(tilesToFetchIds, allTilesIds));
    const tilesToCancel = difference(allTilesIds, tilesToFetchIds);
    const tilesToRefetch = Array.from(intersection(allTilesIds, tilesToFetchIds));

    for (let tileId of tilesToCancel) {
      if (this.tilegrid[tileId].status === TilePromise.IN_PROGRESS) {
        this.tilegrid[tileId].cancel();
      }
    }

    newTilesToFetch.sort((a, b) => (tilesToFetch[a].distance < tilesToFetch[b].distance ? -1 : 1));
    for (let tileId of newTilesToFetch) {
      const { x, y } = tilesToFetch[tileId];
      const tp = new TilePromise(x, y, this.tileFetchingFunction, this);
      this.tilegrid[tileId] = tp;
      tp.fetch();
    }

    tilesToRefetch.sort((a, b) => (tilesToFetch[a].distance < tilesToFetch[b].distance ? -1 : 1));
    for (let tileId of tilesToRefetch) {
      if (
        this.tilegrid[tileId].status === TilePromise.CANCELLED ||
        this.tilegrid[tileId].status === TilePromise.ERROR
      ) {
        this.tilegrid[tileId].fetch();
      }
    }
  };

  stopAnimation() {
    for (let tileId in this.tilegrid) {
      if (this.tilegrid[tileId].status === TilePromise.IN_PROGRESS) {
        this.tilegrid[tileId].cancel();
      }
    }
    while (this.scene.children.length > 0) {
      this.scene.children[0].geometry.dispose();
      this.scene.children[0].material.dispose();
      this.scene.remove(this.scene.children[0]);
    }
    for (let tile of this.tiles) {
      tile.clear();
    }
    this.renderer.renderLists.dispose();
    this.renderer = null;
  }

  calculateTilesInView() {
    this._cameraVector.set(1, 1);
    this._raycaster.setFromCamera(this._cameraVector, this.camera);
    let intersectionTopRight = this._raycaster.ray.intersectPlane(this._plane, this._target.clone());
    this._cameraVector.set(-1, 1);
    this._raycaster.setFromCamera(this._cameraVector, this.camera);
    let intersectionTopLeft = this._raycaster.ray.intersectPlane(this._plane, this._target.clone());

    this._cameraVector.set(1, -1);
    this._raycaster.setFromCamera(this._cameraVector, this.camera);
    const intersectionBottomRight = this._raycaster.ray.intersectPlane(this._plane, this._target.clone());
    this._cameraVector.set(-1, -1);
    this._raycaster.setFromCamera(this._cameraVector, this.camera);
    const intersectionBottomLeft = this._raycaster.ray.intersectPlane(this._plane, this._target.clone());

    const closestTile = {
      x: (intersectionBottomRight.x - intersectionBottomLeft.x) / this.TILE_SIZE_X,
      y: (intersectionBottomRight.z - intersectionBottomLeft.z) / this.TILE_SIZE_Y,
    };

    const lineClose = k =>
      intersectionBottomLeft.clone().add(
        intersectionBottomRight
          .clone()
          .sub(intersectionBottomLeft.clone())
          .normalize()
          .multiplyScalar(k),
      );

    let lineLeft, lineRight;

    if (
      intersectionTopRight === null ||
      intersectionTopLeft === null ||
      lineClose(intersectionBottomLeft.distanceTo(intersectionBottomRight) / 2).distanceTo(
        intersectionTopLeft,
      ) >= this.MAX_DISTANCE
    ) {
      this._cameraVector.set(1, 0.5);
      this._raycaster.setFromCamera(this._cameraVector, this.camera);
      const intersectionMiddleTopRight = this._raycaster.ray.intersectPlane(this._plane, new THREE.Vector3());
      this._cameraVector.set(-1, 0.5);
      this._raycaster.setFromCamera(this._cameraVector, this.camera);
      const intersectionMiddleTopLeft = this._raycaster.ray.intersectPlane(this._plane, new THREE.Vector3());

      lineLeft = k =>
        intersectionBottomLeft.clone().add(
          intersectionMiddleTopLeft
            .clone()
            .sub(intersectionBottomLeft.clone())
            .normalize()
            .multiplyScalar(k),
        );
      lineRight = k =>
        intersectionBottomRight.clone().add(
          intersectionMiddleTopRight
            .clone()
            .sub(intersectionBottomRight.clone())
            .normalize()
            .multiplyScalar(k),
        );

      intersectionTopRight = lineRight(this.MAX_DISTANCE);
      intersectionTopLeft = lineLeft(this.MAX_DISTANCE);
    } else {
      lineLeft = k =>
        intersectionBottomLeft.clone().add(
          intersectionTopLeft
            .clone()
            .sub(intersectionBottomLeft.clone())
            .normalize()
            .multiplyScalar(k),
        );
      lineRight = k =>
        intersectionBottomRight.clone().add(
          intersectionBottomRight
            .clone()
            .sub(intersectionTopRight.clone())
            .normalize()
            .multiplyScalar(k),
        );
    }

    const lineFar = k =>
      intersectionTopLeft.clone().add(
        intersectionTopRight
          .clone()
          .sub(intersectionTopLeft.clone())
          .normalize()
          .multiplyScalar(k),
      );

    const aminX = Math.min(
      intersectionTopRight.x,
      intersectionTopLeft.x,
      intersectionBottomRight.x,
      intersectionBottomLeft.x,
    );
    const aminY = Math.min(
      intersectionTopRight.z,
      intersectionTopLeft.z,
      intersectionBottomRight.z,
      intersectionBottomLeft.z,
    );
    const amaxX = Math.max(
      intersectionTopRight.x,
      intersectionTopLeft.x,
      intersectionBottomRight.x,
      intersectionBottomLeft.x,
    );
    const amaxY = Math.max(
      intersectionTopRight.z,
      intersectionTopLeft.z,
      intersectionBottomRight.z,
      intersectionBottomLeft.z,
    );

    const lineCloseY = x => {
      const k = intersectionBottomLeft
        .clone()
        .negate()
        .setX(x)
        .divide(
          intersectionBottomRight
            .clone()
            .sub(intersectionBottomLeft.clone())
            .normalize(),
        ).x;
      return lineClose(k).z;
    };

    const lineLeftY = x => {
      const k = intersectionBottomLeft
        .clone()
        .negate()
        .setX(x)
        .divide(
          intersectionTopLeft
            .clone()
            .sub(intersectionBottomLeft.clone())
            .normalize(),
        ).x;
      return lineLeft(k).z;
    };

    const lineRightY = x => {
      const k = intersectionBottomRight
        .clone()
        .negate()
        .setX(x)
        .divide(
          intersectionTopRight
            .clone()
            .sub(intersectionBottomRight.clone())
            .normalize(),
        ).x;
      return lineRight(k).z;
    };

    const lineFarY = x => {
      const k = intersectionTopLeft
        .clone()
        .negate()
        .setX(x)
        .divide(
          intersectionTopRight
            .clone()
            .sub(intersectionTopLeft.clone())
            .normalize(),
        ).x;
      return lineFar(k).z;
    };

    const iminX = Math.floor(aminX / this.TILE_SIZE_X);
    const imaxX = Math.floor(amaxX / this.TILE_SIZE_X);
    const iminY = Math.floor(aminY / this.TILE_SIZE_Y);
    const imaxY = Math.floor(amaxY / this.TILE_SIZE_Y);

    const tilesToDownload = {};

    for (let x = iminX; x <= imaxX; x++) {
      const closeY = lineCloseY(x * this.TILE_SIZE_X);
      const leftY = lineLeftY(x * this.TILE_SIZE_X);
      const rightY = lineRightY(x * this.TILE_SIZE_X);
      const farY = lineFarY(x * this.TILE_SIZE_X);

      const minY = Math.max(Math.floor(Math.min(closeY, leftY, rightY, farY) / this.TILE_SIZE_Y), iminY);
      const maxY = Math.min(Math.floor(Math.max(closeY, leftY, rightY, farY) / this.TILE_SIZE_Y), imaxY);

      for (var y = minY; y <= maxY; y++) {
        const distance = Math.pow(closestTile.x - x, 2) + Math.pow(closestTile.y - y, 2);
        tilesToDownload[`${x}-${y}`] = { x: x, y: y, distance: distance };
      }
    }
    return tilesToDownload;
  }
}
