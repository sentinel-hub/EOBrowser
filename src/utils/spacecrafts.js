export function constructSpacecraftInfoSentinel1(name, tiles) {
  // Sentinel 1 can have a lot of acquisitions a day per area. So we won't print the names
  // out like `Sentinel 1A and Sentinel 1B` but will instead use the most recent tile.
  const pattern = /^.*Sentinel-1\/(.*)\/(.*)\.SAFE$/i;
  const mostRecentTile = tiles[0];
  const matches = pattern.exec(mostRecentTile.pathFragment);
  const uniqueSpacecraftName = matches[2].substring(1, 3);
  const newName = name.replace('Sentinel-1', `Sentinel-${uniqueSpacecraftName}`);
  return newName;
}

export function constructSpacecraftInfoSentinel2(name, tiles) {
  const uniqueSatNames = [...new Set(tiles.map(tile => tile.originalId.substring(1, 3)))];
  const newName = name.replace('Sentinel-2', `Sentinel-${uniqueSatNames.join(' and Sentinel-')}`);
  return newName;
}
