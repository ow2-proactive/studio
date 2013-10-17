describe("Jobs Import / Export", function() {

    var jobModel = new Job();
    var workflowView = new WorkflowView({el: $("#workflow-designer"), model: jobModel});
    var propertiesView = new PropertiesView({el: $("#properties-container")});
    var xmlView = new JobXmlView({el: $("#workflow-xml-container"), model: jobModel});

    var readFromServer = function(fileName) {
        console.log("Reading " + httpServer+fileName);
        return $.ajax({
            type: "GET",
            url: httpServer+fileName,
            cache: false,
            async: false
        }).responseText;
    }



    var jobList = $(readFromServer('tests/jobs/'));
    jobList.find('a').each(function(i, jobHtml) {
        var jobName = $(jobHtml).text()
        if (jobName.indexOf('..')!=-1) {return};

        describe(jobName, function() {

            var path = '/tests/jobs/'+jobName;
            var originalJobXml = undefined;
            var generatedXml = undefined;

            it("should be possible to import without exceptions", function() {
                var f = function() {
                    originalJobXml = readFromServer(path);
                    // make some transformation to original xml
                    originalJobXml = originalJobXml.replace(/\/\/\s+<!\[CDATA\[/g, '<![CDATA[')
                    originalJobXml = originalJobXml.replace(/\/\/\s+]]>/g, ']]>')
                    originalJobXml = originalJobXml.replace(/<controlFlow block="none"\s+\/>/g, '');
                    originalJobXml = originalJobXml.replace(/block="none"/g, '');
                    // remove description without cdata
                    originalJobXml = originalJobXml.replace(/<description>\s*\w.*<\/description>/g, '');
                    originalJobXml = originalJobXml.replace(/<javaExecutable (.*)\s+\/>/g, "<javaExecutable $1> </javaExecutable>");

                    try {
                        var json = xmlToJson(parseXml(originalJobXml))
                        workflowView.import(json);
                        jobModel = workflowView.model;
                        xmlView.model = workflowView.model;
                    } catch (e) {
                        console.log(e.stack);
                        throw e;
                    }
                }
                expect(f).not.toThrow();
            });

            it("should be possible to export without exceptions", function() {
                var f = function() {
                    try {
                        generatedXml = xmlView.generateXml()
                    } catch (e) {
                        console.log(e.stack);
                        throw e;
                    }
                }

                expect(f).not.toThrow();
            });

            it("export should equal to import", function() {
                // do not compare schema related stuff

                originalJobXml = originalJobXml.replace(/xmlns:xsi=".*"/, '')
                originalJobXml = originalJobXml.replace(/xmlns=".*"/, '')
                originalJobXml = originalJobXml.replace(/xsi:schemaLocation=".*"/, '')
                originalJobXml = originalJobXml.replace(/\n+/g, ' ')
                originalJobXml = originalJobXml.replace(/\s+/g, ' ')
                originalJobXml = originalJobXml.replace(/<controlFlow block="end" \/>/g, '<controlFlow block="end"> </controlFlow>')
                originalJobXml = originalJobXml.replace(/<controlFlow block="start" \/>/g, '<controlFlow block="start"> </controlFlow>')

                generatedXml = generatedXml.replace(/xmlns:xsi=".*"/, '')
                generatedXml = generatedXml.replace(/xmlns=".*"/, '')
                generatedXml = generatedXml.replace(/xsi:schemaLocation=".*"/, '')
                generatedXml = generatedXml.replace(/\n+/g, ' ')
                generatedXml = generatedXml.replace(/\s+/g, ' ')
                generatedXml = generatedXml.replace(/></g, '> <')


                console.log("old: ", originalJobXml)
                console.log("new: ", generatedXml)

                var res = prettydiff(
                    {
                        source:originalJobXml,
                        sourcelabel: "source " + jobName,
                        diff:generatedXml,
                        difflabel: "result " + jobName,
//                        mode:'diff'
//                        force_indentation: true,
//                        content: false,
//                        wrap: 0
                    })
                var container = $('<div class="shadow"></div>');
                container.append(res)
                var diffElem = container.find("strong:contains('Number of differences')").next('em');
                var diff = parseInt(diffElem.text());

                expect(diff).toBe(0)
                if (diff > 0) {
                    $('body').append(container)
                }
            });
        });
    })

    jobList.remove();

});