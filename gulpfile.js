var gulp = require('gulp');
var $    = require('gulp-load-plugins')();
var argv = require('yargs').argv;

var clean = require('gulp-clean');
var rename = require('gulp-rename');
var size = require('gulp-size');



// babel
// uglify
// concat

// Check for --production flag
var isProduction = !!(argv.production);

// Browsers to target when prefixing CSS.
var COMPATIBILITY = ['last 2 versions', 'ie >= 9'];

// File paths to various assets are defined here.
var PATHS = {
  //assets: [
  //  'src/assets/**/*',
  //  '!src/assets/{img,js,scss}/**/*',
  // 'src/assets/js/**/!(app).js',
  // 'src/assets/js/app.js',
  //],
  mycss: [
    'src/css/scroll-sub-menu.scss',
  ],
  myjs: [
    'src/js/core.js'
  ]
};

// Combine JavaScript into one file
// In production, the file is minified
gulp.task('myjs', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));

  return gulp.src(PATHS.myjs)
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.if(isProduction, $.concat('jquery.scroll-sub-menu.min.js')))
    .pipe($.if(isProduction, uglify))
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe($.size())
    .pipe(gulp.dest('dist'));
});


// Compile file Sass into CSS.
gulp.task('mycss', function() {

  var minifycss = $.if(isProduction, $.minifyCss());

  return gulp.src(PATHS.mycss)
    .pipe($.sourcemaps.init())
    .pipe($.sass()  // Compile
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: COMPATIBILITY
    })) // Rajoute les prefixe automatiquement
    .pipe($.csscomb())  // Met les bonnes propriété dans l'ordre
    .pipe($.cssbeautify({indent: '  '})) // Rend beau le css avec une indentation correcte
    .pipe($.if(isProduction, $.concat('scroll-sub-menu.min.css')))// Concate
    .pipe($.if(isProduction, minifycss)) // Minify
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe($.size())
    .pipe(gulp.dest('dist'));
});


// Combine JavaScript into one file
// In production, the file is minified
gulp.task('gmap', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));

  return gulp.src('js/gmappara.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.rename({suffix:'.min'}))
    .pipe(uglify)
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('../js'));
});

gulp.task('inject',['mycss', 'myjs'], function () {
  var target = gulp.src('../partials/_master.twig');
  // It's not necessary to read the files (will speed up things), we're only after their paths:

  var sources;
  if(isProduction) {
    sources = gulp.src(['../js/prod.min.js','../css/style.min.css'], {read: false});
  } else {
    sources = ['!../css/style.min.css', '../css/!(theme).css','../css/theme.css'];
    sources = sources.concat(PATHS.myjs);
    sources = gulp.src(sources, {read: false});
  }

  return target.pipe($.inject(sources,{ignorePath:'/../', addPrefix:'/theme/my'}))
    .pipe(gulp.dest('../partials/'));
});

// Remove js et css files
gulp.task('clean', function(){
  return gulp.src(['../js/*','../css/*'], {read: false})
    .pipe($.if(isProduction, $.clean({force: true})));
});



// Build the "dist" folder by running all of the above tasks
gulp.task('build', ['clean',  'gmap', 'myjs', 'mycss']);


gulp.task('default', ['gmap', 'myjs', 'mycss'], function() {
  gulp.watch(PATHS.mycss, ['mycss']);
  gulp.watch(PATHS.myjs, ['myjs']);
});


