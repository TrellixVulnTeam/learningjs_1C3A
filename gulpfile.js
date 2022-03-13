let projectFolder = "dist";
let sourceFolder = "#src";
let fs = require("fs");

let path = {
    build: {
        html: projectFolder + "/",
        css: projectFolder + "/css/",
        js: projectFolder + "/js/",
        img: projectFolder + "/img/",
        fonts: projectFolder + "/fonts/",
    },
    src: {
        html: [sourceFolder + "/*.html", "!" + sourceFolder + "/_*.html"],
        css: sourceFolder + "/scss/main.scss",
        js: sourceFolder + "/js/script.js",
        img: sourceFolder + "/img/**/*.png",
        fonts: sourceFolder + "/fonts/*.ttf",
    },
    watch: {
        html: sourceFolder + "/**/*.html",
        css: sourceFolder + "/scss/**/*.scss",
        js: sourceFolder + "/js/**/*.js",
        img: sourceFolder + "/img/**/*.(jpg,png,svg,gif,ico,webp)",
    },
    clean: "./" + projectFolder + "/"
}

let {src, dest} = require("gulp"),
    gulp = require("gulp"),
    browsersync = require("browser-sync").create(),
    fileInclude = require("gulp-file-include"),
    del = require("del"),
    scss = require('gulp-sass')(require('sass')),
    autoPrefixer = require("gulp-autoprefixer"),
    groupMedia = require("gulp-group-css-media-queries"),
    cleanCSS = require("gulp-clean-css"),
    rename = require("gulp-rename"),
    uglify = require("gulp-uglify-es").default,
    imagemin = require("gulp-imagemin"),
    webp = require("gulp-webp"),
    webpHTML = require("gulp-webp-html"),
    webpCSS = require("gulp-webpcss"),
    svgSprite = require("gulp-svg-sprite"),
    ttf2woff = require("gulp-ttf2woff"),
    ttf2woff2 = require("gulp-ttf2woff2");

function browserSync() {
    browsersync.init({
        server: {
            baseDir: "./" + projectFolder + "/"
        },
        port:3000,
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileInclude())
        .pipe(webpHTML())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream());
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            })
        )
        .pipe(groupMedia())
        .pipe(
            autoPrefixer({
                overrideBrowserslist:["last 5 versions"],
                cascade: true
            })
        )
        .pipe(webpCSS())
        .pipe(dest(path.build.css))
        .pipe(cleanCSS())
        .pipe(rename({
            extname: ".min.css"
        }))
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream());
}

function js() {
    return src(path.src.js)
        .pipe(fileInclude())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(rename({
            extname: ".min.js"
        }))
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream());
}

function images() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(imagemin({
           progressive: true,
           svgPlugins: [{ removeViewBox: false}],
           interlaced: true,
           optimizationLevel: 3
        }))
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream());
}
gulp.task("svgSprite", function () {
    return gulp.src([sourceFolder + '/iconsprite/*.svg'])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "..icons/icons.svg",
                    example:true
                }
            },
        }))
        .pipe(dest(path.build.img))
})

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return  src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

function fontsStyle(params) {

    let file_content = fs.readFileSync(sourceFolder + '/scss/base/_typography.scss');
    if (file_content == '') {
        fs.writeFile(sourceFolder + '/scss/base/_typography.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(sourceFolder + '/scss/base/_typography.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() { }

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean() {
        return del(path.clean)
}

let build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontStyle = fontsStyle;
exports.fonts = fonts;
exports.js = js;
exports.images = images;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;