import { CancelToken, isCancelled } from '@sentinel-hub/sentinelhub-js';

export class TilePromise {
  static CREATED = 'created';
  static IN_PROGRESS = 'in_progress';
  static CANCELLED = 'cancelled';
  static ERROR = 'error';
  static FINISHED = 'finished';

  constructor(coordX, coordY, fetchingFunction, map) {
    this.coordX = coordX;
    this.coordY = coordY;
    this.fetchingFunction = fetchingFunction;
    this.map = map;
    this.status = TilePromise.CREATED;
  }

  async fetch() {
    this.abortToken = new AbortToken();
    this.status = TilePromise.IN_PROGRESS;
    this.promise = await new Promise(async (resolve, reject) => {
      try {
        this.abortToken.check();

        const { tile, maxAltitudePixels } = await this.fetchingFunction(
          this.coordX,
          this.coordY,
          this.abortToken,
        );
        this.map.addTile(tile, maxAltitudePixels);
        resolve();
        this.status = TilePromise.FINISHED;
      } catch (err) {
        if (isCancelled(err) || this.abortToken.shouldAbort) {
          this.status = TilePromise.CANCELLED;
        } else {
          this.status = TilePromise.ERROR;
        }
      }
    });
  }

  cancel() {
    this.status = TilePromise.CANCELLED;
    this.abortToken.abort();
  }
}

class AbortToken {
  // https://stackoverflow.com/questions/37624144/is-there-a-way-to-short-circuit-async-await-flow
  shouldAbort = false;
  cancelToken = new CancelToken();

  abort() {
    this.cancelToken.cancel();
    this.shouldAbort = true;
  }

  check() {
    if (this.shouldAbort) {
      this.throw();
    }
  }

  throw() {
    throw new AbortTilePromise();
  }
}

class AbortTilePromise extends Error {
  constructor(message = 'Fetching tile has been aborted.') {
    super(message);
    this.name = this.constructor.name;
  }
}
