// Generated on 2014-01-13 using generator-webapp 0.4.6
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt, {pattern: ['grunt-*', '!grunt-lib-phantomjs']});

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        yeoman: {
            // Configurable paths
            app: 'app',
            dist: 'dist'
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            js: {
                files: ['<%= yeoman.app %>/scripts/{,*/}*.js'],
                tasks: ['jshint'],
                options: {
                    livereload: true
                }
            },
            jstest: {
                files: ['test/spec/{,*/}*.js'],
                tasks: ['test:watch']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            styles: {
                files: ['<%= yeoman.app %>/styles/{,*/}*.css'],
                tasks: ['newer:copy:styles', 'autoprefixer']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= yeoman.app %>/{,*/}*.html',
                    '.tmp/styles/{,*/}*.css',
                    '<%= yeoman.app %>/images/{,*/}*.{gif,jpeg,jpg,png,svg,webp}'
                ]
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                livereload: 35729,
                // Change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    open: true,
                    base: [
                        '.tmp',
                        '<%= yeoman.app %>'
                    ]
                }
            },
            test: {
                options: {
                    port: 9001,
                    base: [
                        '.'
                    ]
                }
            },
            dist: {
                options: {
                    open: true,
                    base: '<%= yeoman.dist %>',
                    livereload: false
                }
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/*',
                        '!<%= yeoman.dist %>/.git*',
                        'public'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.app %>/scripts/proactive/*.js',
                '!<%= yeoman.app %>/scripts/thirdparties/*',
                '<%= yeoman.app %>/scripts/main.js'
            ]
        },

        // jasmine: {
        //     all: {
        //         src: 'test/spec/*.js',
        //        specs: 'test/spec/*.js',
        //         options: {
        //             host: 'http://<%= connect.test.options.hostname %>:<%= connect.test.options.port %>/',
        //             keepRunner: true,
        //             template: require('grunt-template-jasmine-requirejs'),
        //             templateOptions: {
        //                 requireConfigFile: 'app/scripts/main.js',
        //                 requireConfig: {
        //                     baseUrl: 'app/scripts',
        //                     paths: {
        //                         prettydiff: '../../test/libs/prettydiff/prettydiff'
        //                     }
        //                 }
        //             }
        //         }
        //
        //     }
        // },

        // Add vendor prefixed styles
        autoprefixer: {
            options: {
                browsers: ['last 1 version']
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '.tmp/styles/',
                    src: '{,*/}*.css',
                    dest: '.tmp/styles/'
                }]
            }
        },

        // Automatically inject Bower components into the HTML file
        'bower-install': {
            app: {
                html: '<%= yeoman.app %>/index.html',
                ignorePath: '<%= yeoman.app %>/'
            }
        },

        // Renames files for browser caching purposes
        rev: {
            dist: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/scripts/{,*/}*.js',
                        '<%= yeoman.dist %>/styles/{,*/}*.css',
                        '<%= yeoman.dist %>/images/{,*/}*.{gif,jpeg,jpg,png,webp}',
                        '<%= yeoman.dist %>/styles/fonts/{,*/}*.*'
                    ]
                }
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            options: {
                dest: '<%= yeoman.dist %>'
            },
            html: '<%= yeoman.app %>/index.html'
        },

        // Performs rewrites based on rev and the useminPrepare configuration
        usemin: {
            options: {
                assetsDirs: ['<%= yeoman.dist %>']
            },
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css']
        },

        // The following *-min tasks produce minified files in the dist folder
        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{gif,jpeg,jpg,png}',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        svgmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.svg',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    removeAttributeQuotes: true,
                    removeCommentsFromCDATA: true,
                    removeEmptyAttributes: true,
                    removeOptionalTags: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: '{,*/}*.html',
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },

        requirejs: {
            compile: {
                options: {
                    baseUrl: './app/scripts/',
                    mainConfigFile: 'app/scripts/main.js',
                    out: 'dist/scripts/main.js',
                    removeCombined: false,
                    name: 'main',
                    generateSourceMaps: true,
                    preserveLicenseComments: false,
                    optimize: 'uglify2',
                    paths: {
                        'proactive/config': 'empty:'
                    }
                }
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= yeoman.app %>',
                        dest: '<%= yeoman.dist %>',
                        src: [
                            '*.{ico,png,txt}',
                            '.htaccess',
                            'images/{,*/}*.webp',
                            '{,*/}*.html',
                            'libs/requirejs/{,*/}*.js',
                            'libs/pines-notify/jquery*.css',
                            'scripts/proactive/templates/*.html',
                            'scripts/proactive/config.js',
                            'templates/{,*/}*.xml',
                            'studio-conf.js'
                        ]
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= yeoman.app %>/libs/bootstrap/dist/fonts/*.*'],
                        dest: '<%= yeoman.dist %>/fonts/'
                    }
                ]
            },
            styles: {
                expand: true,
                dot: true,
                cwd: '<%= yeoman.app %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            }
        },


        // Generates a custom Modernizr build that includes only the tests you
        // reference in your app
        modernizr: {
            devFile: '<%= yeoman.app %>/libs/modernizr/modernizr.js',
            outputFile: '<%= yeoman.dist %>/libs/modernizr/modernizr.js',
            files: [
                '<%= yeoman.dist %>/scripts/{,*/}*.js',
                '<%= yeoman.dist %>/styles/{,*/}*.css',
                '!<%= yeoman.dist %>/scripts/vendor/*'
            ],
            uglify: true
        },

        // Run some tasks in parallel to speed up build process
        concurrent: {
            server: [
                'copy:styles'
            ],
            test: [
                'copy:styles'
            ],
            dist: [
                'copy:styles',
                'imagemin',
                'svgmin'
            ]
        },
        nightwatch_report: {
            files: ['test/ui/reports/**/*.xml'],
            options: {
                outputDir: 'test/reports/nightwatch'
            }
        },
        selenium_standalone: {
            options: {
                stopOnExit: true
            },
            dev: {
                seleniumVersion: '2.53.0',
                seleniumDownloadURL: 'http://selenium-release.storage.googleapis.com',
                drivers: {
                    chrome: {
                        version: '2.21',
                        arch: process.arch,
                        baseURL: 'http://chromedriver.storage.googleapis.com'
                    },
                    ie: {
                        version: '2.53.0',
                        arch: 'ia32',
                        baseURL: 'http://selenium-release.storage.googleapis.com'
                    }
                }
            }
        },
        bgShell: {
            _defaults: {
                bg: true
            },
            seleniumInstall: {
                cmd: 'node_modules/selenium-standalone/bin/selenium-standalone install',
                bg: false
            },
            seleniumStart: {
                cmd: 'node_modules/selenium-standalone/bin/selenium-standalone start'
            },
            seleniumStop: {
                cmd: 'pkill -f selenium-standalone',
                bg: false
            },
            jsonServerStartSynchronously: {
                cmd: 'node test/json-server-data/mock-scheduler-rest.js',
                bg: false,
                stdout: true
            },
            jsonServerStart: {
                cmd: 'node test/json-server-data/mock-scheduler-rest.js',
                stdout: true
            },
            jsonServerStop: {
                cmd: 'pkill -f json-server'
            },
            nightwatchChrome: {
                cmd: 'node_modules/nightwatch/bin/nightwatch --config test/ui/nightwatch.json --env jenkins-chrome',
                bg: false
            },
            nightwatchPhantomJS: {
                cmd: 'node_modules/nightwatch/bin/nightwatch --config test/ui/nightwatch.json --env jenkins-phantomjs',
                bg: false
            },
            nightwatchDev: {
                cmd: 'node_modules/nightwatch/bin/nightwatch --config test/ui/nightwatch.json',
                bg: false
            }
        }
    });
    grunt.loadNpmTasks('grunt-selenium-standalone');
    grunt.loadNpmTasks('grunt-bg-shell');
    grunt.loadNpmTasks('grunt-nightwatch-report');

    grunt.registerTask('mock:run', 'Expose the studio with a mocked scheduler in a very hacky way but it should be fine', function () {
            grunt.task.run([
                'publishJsonServerFiles',
                'bgShell:jsonServerStartSynchronously'
            ]);
        });

    grunt.registerTask('test:ui:dev', 'Run the ui tests using a mocked REST scheduler', function () {
        grunt.task.run([
            'publishJsonServerFiles',
            'selenium_standalone:dev:install',
            'selenium_standalone:dev:start',
            'bgShell:jsonServerStart',
            'waitFor5Seconds',
            'bgShell:nightwatchChrome',
            'selenium_standalone:dev:stop',
            'bgShell:jsonServerStop',
            'nightwatch_report'
        ]);
    });

    grunt.registerTask('test:ui:jenkins', 'Run the ui tests using a mocked REST scheduler and an external Selenium server', function () {
        grunt.task.run([
            'publishJsonServerFiles',
            'bgShell:jsonServerStart',
            'waitFor5Seconds',
            'bgShell:nightwatchChrome',
            'bgShell:jsonServerStop',
            'nightwatch_report'
        ]);
    });

    grunt.registerTask('publishJsonServerFiles', 'Create the public folder of json-servers', function () {
        grunt.file.mkdir('public');
        grunt.file.copy('dist', 'public/studio');
    });

    grunt.registerTask('waitFor5Seconds', 'Timer', function () {
        grunt.log.write('Waiting for 5 seconds so the mocked REST server can initialize properly');
        var done = this.async();
        setTimeout(done, 5 * 1000);
    });

    grunt.registerTask('test:integration', 'Run the full app and check for errors', function () {
        var phantomjs = require('grunt-lib-phantomjs').init(grunt);

        phantomjs.on('test.ok', function (msg) {
            grunt.log.writeln(msg);
            phantomjs.halt();
        });

        phantomjs.on('test.fail', function (msg) {
            grunt.fail.warn(msg);
            phantomjs.halt();
        });

        // This task is async.
        var done = this.async();

        // 'http://127.0.0.1:9001/app/'
        phantomjs.spawn('http://localhost:8080/studio', {
            // Additional PhantomJS options.
            options: {
                phantomScript: 'test/integration_test.js'
            },
            // Complete the task when done.
            done: function (err) {
                done(err);
            }
        });
    });

    grunt.registerTask('serve', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'concurrent:server',
            'autoprefixer',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('server', function () {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve']);
    });

    grunt.registerTask('test', function (target) {
        if (target !== 'watch') {
            grunt.task.run([
                'clean:server',
                'concurrent:test',
                'autoprefixer',
            ]);
        }

        grunt.task.run([
            'connect:test',
            // 'jasmine',
            //'test:integration'
            'test:ui'
        ]);
    });

    grunt.registerTask('testJenkins', function (target) {
        if (target !== 'watch') {
            grunt.task.run([
                'clean:server',
                'concurrent:test',
                'autoprefixer',
            ]);
        }

        grunt.task.run([
            'connect:test',
            'test:ui:jenkins'
        ]);
    });

    grunt.registerTask('build', [
        'clean:dist',
        'useminPrepare',
        'concurrent:dist',
        'autoprefixer',
        'concat',
        'cssmin',
        'requirejs',
        'copy:dist',
        'usemin',
        'htmlmin'
    ]);

    grunt.registerTask('default', [
        'newer:jshint',
        'test',
        'build'
    ]);
};
