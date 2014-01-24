define(['proactive/view/xml/JobXmlView', 'proactive/model/Job', 'proactive/view/utils/undo',
    'xml2json', 'prettydiff'
],
    function(JobXmlView, Job, undoManager, xml2json, prettydiff) {

return describe("Jobs Import / Export", function() {

    var readFromServer = function(fileName) {
        console.log("Reading " + httpServer+fileName);
        return $.ajax({
            type: "GET",
            url: httpServer+fileName,
            cache: false,
            async: false
        }).responseText;
    }

    window.localStorage.clear()

    var pathArr = location.pathname.split( '/' );
    var path = '';
    for (var i=0; i<pathArr.length-2; i++) {
        path += pathArr[i] + '/';
    }
    var httpServer = location.protocol + "//" + location.host + path;//"http://localhost:8000/";

    var jobList = $(readFromServer('/test/jobs/'));
    jobList.find('[href*=".xml"]').each(function(i, jobHtml) {
        var jobName = $(jobHtml).text()
        console.log(undoManager)
        undoManager._disable()
        var xmlView = new JobXmlView()
        var jobModel = new Job()

        if (jobName.indexOf('..')!=-1) {return};

        describe(jobName, function() {

            var path = '/test/jobs/'+jobName;
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
                    // we dropped this field
                    originalJobXml = originalJobXml.replace(/ projectName=\"\w*\"/g, '');

                    try {
                        var json = xml2json.xmlToJson(xml2json.parseXml(originalJobXml))
                        jobModel.populate(json.job)

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
                        xmlView.model = jobModel;
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
});