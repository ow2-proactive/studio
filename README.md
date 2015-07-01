Setup
===================

You need npm installed (Node.js).

Run these commands to setup your dev environment:

```
npm install -g grunt-cli bower
npm install
bower install
```

Then to deploy the studio with the scheduler create a symlink in `$SCHEDULER_HOME/distr/war`
pointing to `app`.
