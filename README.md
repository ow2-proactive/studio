# Workflow Studio for ProActive Workflows & Scheduling

[![Build Status](http://jenkins.activeeon.com/buildStatus/icon?job=studio)](http://jenkins.activeeon.com/job/studio/)


## Requirements
You need npm installed (Node.js).
Selenium-standalone is required for the UI tests (installed locally by npm).


## Setup

Run these commands to setup your dev environment:

```
npm install -g grunt-cli bower
npm install
bower install
```

Then to deploy the studio with the scheduler create a symlink in `$SCHEDULING_HOME/dist/war`
pointing to `app`.

# Tests

## Setup 
- Fulfill the dependencies with `npm install` and `bower install`. 
Then let's assume you did some changes to the code, you want to check for regressions.
 You need to either run `grunt clean build test:ui:dev`(test is a predefined task of grunt,
  and already runs some syntax check on the code).
  
### Manual Test Execution
- On the first run you need to use `node_modules/selenium-standalone/bin/selenium-standalone install` which
    will install generic drivers and chrome drivers (firefox stopped support of their selenium driver and
     started a new webdriver in Rust). Once selenium server is downloaded,
      you can run it with `node_modules/selenium-standalone/bin/selenium-standalone start` to start
       your local selenium server instance.
       
- Call nightwatch with your config and test suite
`node_modules/nightwatch/bin/nightwatch --config test/ui/nightwatch.json --env jenkins-chrome` for example
 

## How to run a specific test case
The test will assume you have a running studio instance (either in a real release that is running locally, or using method B). Method B doesn't require any running release, you have to run the following command `node test/json-server-data/mock-scheduler-rest.js` from your studio respository. Then you can run a single test file using `node_modules/nightwatch/bin/nightwatch --config test/ui/nightwatch.json --test test/ui/specs/login.js --testcase "PWS-159 The dialog Please open a workflow appears behind the no workflow open panel"`
if you don't specify the --testcase it will run the whole test file
