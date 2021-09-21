export function constructCSVFromData(data, dropColumns) {
  const keys = Object.keys(data);
  let csv = [];

  for (let i = 0; i < data[keys[0]].length; i++) {
    const bandsLine = [];
    const bandNames = [];

    for (let key of keys) {
      const bandLine = { ...data[key][i] };
      bandLine.date = bandLine.date.toISOString();
      bandsLine.push(bandLine);
      bandNames.push(key);
    }

    if (i === 0) {
      const { line, names } = constructCSVLine(bandsLine, bandNames, dropColumns, []);
      csv = [names.join(','), line.join(',')].join('\n');
    } else {
      const { line } = constructCSVLine(bandsLine, bandNames, dropColumns);
      csv = csv + '\n' + line.join(',');
    }
  }
  return csv;
}

function constructCSVLine(objects, objectNames, dropColumns = [], header) {
  // This function only works for flat objects, as only that is needed currently
  // Extended code which constructs a line from nested objects can be found here:
  // 
  let line = [];
  const constructHeader = !!header;

  for (let i = 0; i < objects.length; i++) {
    for (let key in objects[i]) {
      if (dropColumns.includes(key)) {
        continue;
      }
      line.push(objects[i][key]);
      if (constructHeader) {
        header.push(objectNames[i] + '/' + key);
      }
    }
  }
  return { line: line, names: header };
}
