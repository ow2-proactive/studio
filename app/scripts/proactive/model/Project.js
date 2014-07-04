define(
    [
        'backbone',
        'xml2json',
        'proactive/rest/studio-client'
    ],

    function (Backbone, xml2json, StudioClient) {

    "use strict";

    return Backbone.Model.extend({
        supports_html5_storage: function () {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        },
        init: function () {
            if (this.supports_html5_storage() && !localStorage["workflows"]) {
                localStorage["workflows"] = "[]";
            }
        },
        addEmptyWorkflow: function (name, xml) {
            if (this.supports_html5_storage() && localStorage["workflows"]) {

                var localJobs = JSON.parse(localStorage["workflows"]);
                var workflow = {'name': name, 'xml': xml,
                    metadata: JSON.stringify({
                        created_at: new Date().getTime(),
                        updated_at: new Date().getTime()
                    })};
                var id = StudioClient.createWorkflowSynchronously(workflow);
                if (id) workflow.id = id;

                localJobs.push(workflow);
                localStorage["workflow-selected"] = localJobs.length - 1;
                localStorage["workflows"] = JSON.stringify(localJobs);
            }
        },
        getWorkFlows: function () {
            if (this.supports_html5_storage() && localStorage["workflows"]) {
                return JSON.parse(localStorage["workflows"])
            }
            return [];
        },
        getCurrentWorkFlowAsJson: function () {
            if (this.supports_html5_storage() && localStorage["workflows"] && localStorage["workflow-selected"] != undefined) {
                var selectedIndex = localStorage["workflow-selected"];
                if (!localStorage["workflows"]) return;

                var localJobs = JSON.parse(localStorage["workflows"]);

                if (!localJobs[selectedIndex] && localJobs.length > 0) {
                    selectedIndex = localJobs.length - 1;
                    localStorage["workflow-selected"] = selectedIndex;
                    console.log("Selected index out of range - selecting the latest workflow");
                }

                if (localJobs[selectedIndex]) {
                    return xml2json.xmlToJson(xml2json.parseXml(localJobs[selectedIndex].xml))
                }
            }
        },
        saveCurrentWorkflow: function (name, workflowXml, offsets) {
            if (this.supports_html5_storage() && workflowXml) {

                if (!localStorage["workflows"]) {
                    this.init();
                    this.addEmptyWorkflow(name, workflowXml);
                }

                var selectedIndex = localStorage["workflow-selected"];
                var localJobs = JSON.parse(localStorage['workflows']);

                var meta = JSON.parse(localJobs[selectedIndex].metadata);

                if (localJobs[selectedIndex].name != name || localJobs[selectedIndex].xml != workflowXml || meta.offsets != offsets) {

                    localJobs[selectedIndex].name = name;
                    localJobs[selectedIndex].xml = workflowXml;

                    meta.offsets = offsets;
                    meta.updated_at = new Date().getTime();
                    localJobs[selectedIndex].metadata = JSON.stringify(meta);

                    localStorage['workflows'] = JSON.stringify(localJobs);

                    var workflow = localJobs[selectedIndex];
                    StudioClient.updateWorkflow(workflow.id, workflow, true);
                }
            }
        },
        setSelectWorkflowIndex: function (index) {
            if (this.supports_html5_storage()) {
                localStorage["workflow-selected"] = index;
            }
        },
        getSelectWorkflowIndex: function () {
            if (this.supports_html5_storage() && localStorage["workflow-selected"]) {
                return localStorage["workflow-selected"]
            }
        },
        getSavedWorkflowCount: function () {
            if (this.supports_html5_storage() && localStorage["workflow-selected"]) {
                var localJobs = JSON.parse(localStorage['workflows']);
                return localJobs.length;
            }

            return 0;
        },
        removeWorkflow: function (index) {
            if (this.supports_html5_storage() && localStorage["workflow-selected"]) {
                var localJobs = JSON.parse(localStorage['workflows']);
                var workflow = localJobs[index];
                localJobs.splice(index, 1);
                localStorage['workflows'] = JSON.stringify(localJobs);

                if (localJobs.length <= localStorage["workflow-selected"]) {
                    localStorage['workflow-selected'] = localJobs.length - 1;
                }
                StudioClient.removeWorkflow(workflow.id);
            }
        },
        cloneWorkflow: function (index) {
            if (this.supports_html5_storage() && localStorage["workflow-selected"]) {
                var localJobs = JSON.parse(localStorage['workflows']);
                var workflow = localJobs[index];
                var id = StudioClient.createWorkflowSynchronously(workflow);
                if (id) workflow.id = id;

                localJobs.push(localJobs[index]);
                localStorage['workflows'] = JSON.stringify(localJobs);
            }
        },
        updatedAt: function (workflow) {
            return JSON.parse(workflow.metadata).updated_at;
        },
        sync: function () {
            if (this.supports_html5_storage()) {
                if (!this.remoteJobs) {
                    // TODO loading indicator

                    this.remoteJobs = StudioClient.getWorkflowsSynchronously();

                    if (this.remoteJobs) {

                        var remoteJobIds = {};
                        for (var i in this.remoteJobs) {
                            remoteJobIds[this.remoteJobs[i].id] = this.remoteJobs[i];
                        }

                        var localJobs = JSON.parse(localStorage['workflows']);
                        var reload = false;

                        for (var i in localJobs) {
                            var localJob = localJobs[i];
                            if (!localJob.id) {
                                // creating new job
                                StudioClient.createWorkflowSynchronously(localJob)
                                reload = true;
                            } else if (!remoteJobIds[localJob.id]) {
                                // job was removed from the server
                            } else if (this.updatedAt(localJob) > this.updatedAt(remoteJobIds[localJob.id])) {
                                // job was updated locally - updating on the server
                                StudioClient.updateWorkflow(localJob.id, localJob, false);
                                reload = true;
                            }
                        }

                        if (reload) {
                            this.remoteJobs = StudioClient.getWorkflowsSynchronously();
                            console.log("Reloading remote workflows", this.remoteJobs)
                        }

                        localStorage['workflows'] = JSON.stringify(this.remoteJobs);
                    }
                }
            }
        },
        saveOffsetsToLocalStorage: function (offsets) {
            if (this.supports_html5_storage()) {
                var selectedIndex = localStorage["workflow-selected"];
                var localJobs = JSON.parse(localStorage['workflows']);

                var meta = null;
                if (!localJobs[selectedIndex].metadata) {
                    meta = {};
                } else {
                    meta = JSON.parse(localJobs[selectedIndex].metadata);
                }

                meta.offsets = offsets;

                localJobs[selectedIndex].metadata = JSON.stringify(meta);
                localStorage["workflows"] = JSON.stringify(localJobs);
            }
        },
        getOffsetsFromLocalStorage: function () {
            if (this.supports_html5_storage()) {
                var selectedIndex = localStorage["workflow-selected"];
                var localJobs = JSON.parse(localStorage['workflows']);
                var meta = JSON.parse(localJobs[selectedIndex].metadata);
                return meta.offsets;
            }
        }

    })

})
