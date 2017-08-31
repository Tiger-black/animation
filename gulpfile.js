/**
 * 
 * @fileOverview gulp打包入口
 * gulp tag --entry [path/build.json] --env production : 执行git tag时，自动发布js资源（不对html进行构建发布）到cdn
 * gulp deploy --entry [path/build.json] --env [daily、pre、production] : 进行日常、预发及线上部署。线上部署时，只构建html（线上使用cdn发布js）。日常及预发部署时，js和html build到同一目录下。
 * @author leo.yy
 * 
 */
var ARGS = process.argv.splice(2);
var gulp = require('gulp');
var uglify = require("gulp-uglify");
var del = require('del');
var jshint = require('gulp-jshint');
var inlinesource = require('gulp-inline-source');
var htmlmin = require('gulp-htmlmin');
var less = require('gulp-less');
var inlineCss = require('gulp-inline-css');
var replace = require('gulp-replace');
var fs = require('fs');
var path = require('path');
var Webpack = require('webpack');
var gutil = require('gulp-util'); //工具
var colors = require('cli-color');
var errorRed = colors.red;
var successGreen = colors.green;
var warnYellow = colors.yellow;
var infoBlue = colors.blue;
var msgMagenta = colors.magentaBright;

var buildInfos = false;
var isLintFailed = false; // lint检测flag

var env = ARGS[4]; // 构建环境
var buildConfig = { // 构建配置（根据不同的发布环境而不同）
	htmlBuildPath: false, // html build完成后的存储路径（默认存储在 工程目录下的deploy文件夹）
	jsBuildPath: false // js build完成后的存储路径（默认存储在 工程目录下的deploy/javascripts/build/文件夹）
};
var deployTask = []; // gulp 任务序列

if (env === 'production' || env === 'production-build') {
	//【仅构建和发布html】或【仅进行线上构建不发布】 线上构建，由于线上使用cdn，需要剥离html和js,发布线上
	deployTask = ['init', 'clean', 'buildLess', 'buildhtml'];
	buildConfig.htmlBuildPath = './deploy/html/build/';
} else if (env === 'tag') {
	//【仅构建和发布js文件】 由git hock触发，全量build发布构建js文件到线上,并且将使用cdn地址的html发布到预发环境
	deployTask = ['init', 'clean', 'lint', 'webpack-lint', 'minify-js-lint', 'buildLess', 'buildhtml'];
	buildConfig.jsBuildPath = './deploy/javascripts/build/';
	buildConfig.htmlBuildPath = './deploy/html/build/';
} else if (env === 'daily' || env === 'pre') {
	//【构建全部html及js文件】 日常、预发构建 构建后js、html路径一致
	deployTask = ['init', 'clean', 'lint', 'webpack-lint', 'minify-js-lint', 'buildLess', 'buildhtml'];;
	buildConfig.jsBuildPath = './deploy/build/';
	buildConfig.htmlBuildPath = './deploy/build/';
} else {
	if (ARGS[0] == 'lint') {
		console.log(infoBlue('开始代码检测'));
	} else {
		console.log(errorRed('您选择的构建环境异常！构建结束。'));
	}
}
var webpackConfig = require('br-bid/webpack/production.config')(buildConfig.jsBuildPath);

var startTime = new Date().getTime();

gulp.task('init', function(callback) {
	console.log(infoBlue('初始化发布开始...'));
	console.log(infoBlue('当前构建环境是:' + env));
	if (!buildInfos) {
		var configurePath = path.resolve(ARGS[2]); // 获取build.json path参数
		buildInfos = require(require.resolve(configurePath));
	}
	if (buildInfos.version) {
		try {
			var newJsEntry = JSON.stringify(buildInfos.jsEntry).replace(/\@version/g, buildInfos.version)
			webpackConfig.entry = JSON.parse(newJsEntry);
		} catch (e) {
			throw new Error(errorRed('发布失败：config["bid-js-entry"]解析@version发生错误。'));
		}
	} else {
		throw new Error(errorRed('发布失败：config.json中version字段异常或您当前的git环境存在异常。'));
	}
	callback(); // 发布初始化
});

gulp.task('clean', function(cb) { // 重置build目录
	var buildPath = path.join(process.cwd(), './deploy');
	fs.exists(buildPath, function(exists) {
		if (exists) {
			del.sync([buildPath]);
			console.log(infoBlue('正在重建build目录...'))
			cb();
		} else {
			console.log(infoBlue('未找到build文件夹...'))
			cb();
		}
	});
});

gulp.task('lint', function() { // 代码健康检测
	console.log(infoBlue('正在进行js规范检测...'));
	if (!buildInfos) {
		try {
			buildInfos = require(path.join(process.cwd(), 'build.json'));
		} catch (e) {
			console.log(warnYellow('加载build.json异常'));
		}
	}
	var lintConfig = {
		entry: ['!./src/**/**/*.min.js', '!./src/**/**/*.lintignore.js', '!./src/c/common/rem.js']
	};
	if (buildInfos && buildInfos.jsEntry) {
		for (var jName in buildInfos.jsEntry) {
			lintConfig.entry.push(buildInfos.jsEntry[jName]);
		}
	} else { // 如果是直接执行gulp lint，则直接对全部js进行lint检测
		lintConfig.entry.push('./src/**/**/*.js');
	}

	return gulp.src(lintConfig.entry)
		.pipe(jshint()) //自动在目录查找.jshintrc 直到找到为止
		// .pipe(jshint.reporter('default'));
		.pipe(jshint.reporter(function(errors) {
			if (errors.length) {
				console.log(errorRed('* 检测文件：', errors[0].file));
				errors.forEach(function(error, index) {
					var e = error.error;
					var file = error.file;
					console.log(warnYellow('  -- 所在代码: '), msgMagenta(e.evidence && e.evidence.split(' ').join('')), warnYellow('  at line(', e.line, ')/character(', e.character, ')'));
					console.log(warnYellow('         原因：'), infoBlue(e.reason));
					console.log('');
				});
				isLintFailed = true;
			}
		}));
});

gulp.task('webpack-lint', ['lint'], function(callback) { // webpack+lint
	if (!isLintFailed) {
		console.log(successGreen('js规范检测通过!'))
	} else {
		console.log(warnYellow('请规范您的代码!'))
	}
	Webpack(webpackConfig, function(err, stats) {
		if (err) throw new gutil.PluginError("webpack", err);
		gutil.log("[webpack]", stats.toString({
			chunks: false,
			colors: true,
			children: false
		}));
		callback();
	});
});

gulp.task('minify-js-lint', ['webpack-lint'], function() { // lint打包完成后，执行js压缩
	gulp.src(buildConfig.jsBuildPath + '**/*.js') // 要压缩的js文件
		.pipe(uglify()) //使用uglify进行压缩,更多配置请参考：
		.pipe(gulp.dest(buildConfig.jsBuildPath)); //压缩后的路径
});

gulp.task('buildLess', function(callback) {
	//编译src目录下的所有less文件
	console.log(infoBlue('正在编译Less...'));
	gulp.src('./src/**/**/*.less')
		.pipe(less())
		.pipe(gulp.dest('./src/'));
	setTimeout(function() { // 解决css没有生成就进行callback的问题
		console.log(infoBlue('编译Less结束...'));
		callback();
	}, 3000);
});

gulp.task('buildhtml', ['init', 'clean', 'buildLess'], function(callback) { // 压缩html并迁移至相对目录
	console.log(infoBlue('正在压缩迁移html...'));
	var v = buildInfos.version ? buildInfos.version : '';
	// return gulp.src('./src/p/**/*.html')
	var htmlSrc = buildInfos && buildInfos && buildInfos.htmlEntry && buildInfos.htmlEntry.length ? buildInfos.htmlEntry : './src/p/**/*.html';
	// 如果htmlEntry为空数组，则迁移全部html
	if (env === 'production') { // 如果是发布线上，则使用CDN路径替换js引用
		gulp.src(htmlSrc, {
				base: './src/p'
			})
			.pipe(inlinesource())
			/*.pipe(inlineCss({
				applyStyleTags: true,
				applyLinkTags: false,
				removeStyleTags: false
			}))*/
			.pipe(replace(/<(html|body)>/g, ''))
			.pipe(replace(/\@version/g, v))
			.pipe(replace(/\@cdnhost/g, buildInfos.cdnhost + '/' + buildInfos.appName))
			.pipe(htmlmin({
				collapseWhitespace: true
			}))
			.pipe(gulp.dest(buildConfig.htmlBuildPath + 'src/p/'));
	} else if (env === 'tag') { // git_hooks触发js发布，
		gulp.src(htmlSrc, {
				base: './src/p'
			})
			.pipe(inlinesource())
			/*.pipe(inlineCss({
				applyStyleTags: true,
				applyLinkTags: false,
				removeStyleTags: false
			}))*/
			.pipe(replace(/<(html|body)>/g, ''))
			.pipe(replace(/\@version/g, v))
			.pipe(replace(/\@cdnhost/g, buildInfos.cdnhost + '/' + buildInfos.appName))
			.pipe(replace(/\<\/body\>/, '<script>var node=document.createElement("H1");var textnode=document.createTextNode("这是最终预发测试页面");node.style.width="100%";node.style.width="100%";node.style.position="fixed";node.style["line-height"]="100px";node.style.top="50px";node.style.left="0";node.style["font-size"]="30px";node.style["text-align"]="center";node.style["background-color"]="yellow";node.style.color="#000";node.appendChild(textnode);document.body.appendChild(node);setTimeout(function(){document.body.removeChild(node);},6000);</script></body>'))
			.pipe(htmlmin({
				collapseWhitespace: true
			}))
			.pipe(gulp.dest(buildConfig.htmlBuildPath + 'src/p/'));
	} else { // 发布日常、预发，则按照相对路径替换js引用路径
		gulp.src(htmlSrc, {
				base: './src/p'
			})
			.pipe(inlinesource())
			.pipe(replace(/<(html|body)>/g, ''))
			.pipe(replace(/\@cdnhost[\s\S\/]+\@version/g, './' + v))
			.pipe(replace(/\@version/g, v)) // 兼容旧版形如<script type="text/javascript" src="./@version/index.js"></script>地址的替换
			.pipe(htmlmin({
				collapseWhitespace: true
			}))
			.pipe(gulp.dest(buildConfig.htmlBuildPath + 'src/p/'));
	}
	// return callback();
});

gulp.task('deploy', deployTask, function(callback) {
	var totalTime = Number((new Date().getTime() - startTime) / 1000);
	console.log(successGreen('构建任务结束，本次耗时：' + totalTime + 's。'))
	callback();
});