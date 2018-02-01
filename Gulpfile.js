/* Import */
const gulp = require('gulp');
const sass = require('gulp-ruby-sass');
const concat = require('gulp-concat');
const minify = require('gulp-minify');

/* Tasks */
gulp.task('sass', () => {
  return sass('styles/*.scss')
    .on('error', sass.logError)
    .pipe(gulp.dest('assets/'));
});

gulp.task('script', () => {
  return gulp
    .src('source/renderer/*')
    .pipe(concat('script.js'))
    .pipe(
      minify({
        noSource: true,
        ext: {
          src: '.js',
          min: '.min.js'
        }
      })
    )
    .pipe(gulp.dest('./assets/'));
});

/* Watch task */
gulp.task('watch', () => {
  gulp.watch('styles/*.scss', ['sass']);
  gulp.watch('source/renderer/*.js', ['script']);
});

/* Default */
gulp.task('default', ['sass', 'script']);
