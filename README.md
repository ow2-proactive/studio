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
