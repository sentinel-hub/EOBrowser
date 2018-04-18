const gulp = require('gulp');
const template = require('gulp-template');
const clean = require('gulp-clean');
const runSequence = require('run-sequence');

const SH_EOBROWSER = {
    shortName: 'EOBrowser',
    name: 'EO Browser',
    url: 'apps.sentinel-hub.com/eo-browser',
    description: 'EO Browser playing with Sentinel satellite imagery',
    GMkey: 'AIzaSyBouA96JU3PO36HzbJwFIekI2-e6elIBx0',
    color: '#B6BF00',
    login: 'yes',
    target: 'aws',
    s3: 'no',
    l8aws: 'yes',
    l8name: 'Landsat 8 ESA',
  },
  SH_EOBROWSER_S3 = {
    shortName: 'EOBrowser',
    name: 'EO Browser',
    url: 'apps.sentinel-hub.com/eo-browser-s3',
    description: 'EO Browser playing with Sentinel satellite imagery',
    GMkey: 'AIzaSyBouA96JU3PO36HzbJwFIekI2-e6elIBx0',
    color: '#B6BF00',
    login: 'yes',
    target: 'aws',
    s3: 'yes',
    l8aws: 'no',
    l8name: 'Landsat 8',
  },
  IPT_EOBROWSER = {
    shortName: 'EOBrowser',
    name: 'EO Browser',
    url: 'apps.eocloud.sentinel-hub.com/eo-browser',
    description: 'EO Browser playing with Sentinel satellite imagery',
    GMkey: 'AIzaSyBouA96JU3PO36HzbJwFIekI2-e6elIBx0',
    color: '#B6BF00',
    login: 'yes',
    target: 'ipt',
    s3: 'no',
    l8name: 'Landsat 8',
    l8aws: 'no'
  },
  IMAGE_BROWSER = {
    shortName: 'ImageBrowser',
    name: 'Image Browser',
    url: 'apps.sentinel-hub.com/image-browser',
    GMkey: 'AIzaSyBouA96JU3PO36HzbJwFIekI2-e6elIBx0',
    description: 'Image Browser playing with Sentinel satellite imagery',
    color: '#B6BF00',
    login: 'no',
    target: 'imageBrowser',
    s3: 'no',
    l8name: 'Landsat 8',
    l8aws: 'yes'
  },
  AMAZON_IMAGE_BROWSER = {
    shortName: 'ImageBrowser',
    name: 'Image Browser',
    url: 'sentinel-pds.s3-website.eu-central-1.amazonaws.com/image-browser',
    GMkey: '',
    description: 'Image Browser playing with Sentinel satellite imagery',
    color: '#B6BF00',
    login: 'no',
    target: 'imageBrowser',
    s3: 'no',
    l8name: 'Landsat 8',
    l8aws: 'no'
  }

// first we cleanup all generated files
gulp.task('clean', function () {
  return gulp.src([
    'public/index.html',
    '.env1',
    'package.json',
  ], {read: false})
    .pipe(clean());
});

// tasks for sentinel-hub eo browser
gulp.task('htmlSHEB', () =>
  gulp.src('templates/index.html')
    .pipe(template(SH_EOBROWSER))
    .pipe(gulp.dest('public'))
);
gulp.task('jsonSHEB', () =>
  gulp.src('templates/package.json')
    .pipe(template(SH_EOBROWSER))
    .pipe(gulp.dest('./'))
);
gulp.task('cssSHEB', () =>
  gulp.src('templates/variables.scss')
    .pipe(template(SH_EOBROWSER))
    .pipe(gulp.dest('src'))
);
gulp.task('envSHEB', () =>
  gulp.src('templates/.env')
    .pipe(template(SH_EOBROWSER))
    .pipe(gulp.dest('./'))
);
// tasks for sentinel-hub eo browser
gulp.task('htmlSHEBS3', () =>
  gulp.src('templates/index.html')
    .pipe(template(SH_EOBROWSER_S3))
    .pipe(gulp.dest('public'))
);
gulp.task('jsonSHEBS3', () =>
  gulp.src('templates/package.json')
    .pipe(template(SH_EOBROWSER_S3))
    .pipe(gulp.dest('./'))
);
gulp.task('cssSHEBS3', () =>
  gulp.src('templates/variables.scss')
    .pipe(template(SH_EOBROWSER_S3))
    .pipe(gulp.dest('src'))
);
gulp.task('envSHEBS3', () =>
  gulp.src('templates/.env')
    .pipe(template(SH_EOBROWSER_S3))
    .pipe(gulp.dest('./'))
);
// tasks for IPT eo browser
gulp.task('htmlIPT', () =>
  gulp.src('templates/index.html')
    .pipe(template(IPT_EOBROWSER))
    .pipe(gulp.dest('public'))
);
gulp.task('jsonIPT', () =>
  gulp.src('templates/package.json')
    .pipe(template(IPT_EOBROWSER))
    .pipe(gulp.dest('./'))
);
gulp.task('cssIPT', () =>
  gulp.src('templates/variables.scss')
    .pipe(template(IPT_EOBROWSER))
    .pipe(gulp.dest('src'))
);
gulp.task('envIPT', () =>
  gulp.src('templates/.env')
    .pipe(template(IPT_EOBROWSER))
    .pipe(gulp.dest('./'))
);
// tasks for Image browser on SH
gulp.task('htmlIB', () =>
  gulp.src('templates/index.html')
    .pipe(template(IMAGE_BROWSER))
    .pipe(gulp.dest('public'))
);
gulp.task('jsonIB', () =>
  gulp.src('templates/package.json')
    .pipe(template(IMAGE_BROWSER))
    .pipe(gulp.dest('./'))
);
gulp.task('cssIB', () =>
  gulp.src('templates/variables.scss')
    .pipe(template(IMAGE_BROWSER))
    .pipe(gulp.dest('src'))
);
gulp.task('envIB', () =>
  gulp.src('templates/.env')
    .pipe(template(IMAGE_BROWSER))
    .pipe(gulp.dest('./'))
);
// tasks for Image browser on Amazon AWS
gulp.task('htmlAmazon', () =>
  gulp.src('templates/index.html')
    .pipe(template(AMAZON_IMAGE_BROWSER))
    .pipe(gulp.dest('public'))
);
gulp.task('jsonAmazon', () =>
  gulp.src('templates/package.json')
    .pipe(template(AMAZON_IMAGE_BROWSER))
    .pipe(gulp.dest('./'))
);
gulp.task('cssAmazon', () =>
  gulp.src('templates/variables.scss')
    .pipe(template(AMAZON_IMAGE_BROWSER))
    .pipe(gulp.dest('src'))
);
gulp.task('envAmazon', () =>
  gulp.src('templates/.env')
    .pipe(template(AMAZON_IMAGE_BROWSER))
    .pipe(gulp.dest('./'))
);

// run 'gulp {task name}' and then 'npm run build'
gulp.task('IPT', function(callback) {
  runSequence('clean', ['htmlIPT', 'jsonIPT', 'cssIPT', 'envIPT'], callback);
});
gulp.task('imageBrowser', function(callback) {
  runSequence('clean', ['htmlIB', 'jsonIB', 'cssIB', 'envIB'], callback);
});
gulp.task('shEB', function(callback) {
  runSequence('clean', ['htmlSHEB', 'jsonSHEB', 'cssSHEB', 'envSHEB'], callback);
});
gulp.task('imageBrowserAmazon', function(callback) {
  runSequence('clean', ['htmlAmazon', 'jsonAmazon', 'cssAmazon', 'envAmazon'], callback);
});