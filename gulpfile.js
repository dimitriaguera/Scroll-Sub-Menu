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
  mycss: [
    'src/css/animation.scss',
    'src/css/scroll-sub-menu.scss'
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
    .pipe($.if(!isProduction, $.concat('jquery.scroll-sub-menu.js')))
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
    }))
    .pipe($.csscomb())
    .pipe($.cssbeautify({indent: '  '}))
    .pipe($.if(isProduction, $.concat('scroll-sub-menu.min.css')))
    .pipe($.if(isProduction, minifycss)) // Minify
    .pipe($.if(!isProduction, $.concat('scroll-sub-menu.css')))
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe($.size())
    .pipe(gulp.dest('dist'));
});


// Remove js et css files
gulp.task('clean', function(){
  return gulp.src(['dist/*'], {read: false})
    .pipe($.if(isProduction, $.clean({force: true})));
});



// Build the "dist" folder by running all of the above tasks
gulp.task('build', ['clean', 'myjs', 'mycss']);


gulp.task('default', ['myjs', 'mycss'], function() {
  gulp.watch(PATHS.mycss, ['mycss']);
  gulp.watch(PATHS.myjs, ['myjs']);
});


