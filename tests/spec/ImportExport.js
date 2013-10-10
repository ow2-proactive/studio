describe("Player", function() {
//  var player;
//  var song;
//
//  beforeEach(function() {
//    player = new Player();
//    song = new Song();
//  });
//
//  it("should be able to play a Song", function() {
//    player.play(song);
//    expect(player.currentlyPlayingSong).toEqual(song);
//
//    //demonstrates use of custom matcher
//    expect(player).toBePlaying(song);
//  });
//

    var httpServer = "http://localhost:8000/";

    var jobModel = new Job();
    //var palleteView = new PaletteView({el: $("#palette-container")});
    var workflowView = new WorkflowView({el: $("#workflow-designer"), model: jobModel});
    var propertiesView = new PropertiesView({el: $("#properties-container")});
    var xmlView = new JobXmlView({el: $("#workflow-xml-container"), model: jobModel});

    var readFile = function(fileName) {
        return $.ajax({
            type: "GET",
            url: httpServer+fileName,
            async: false
        }).responseText;
    }

    var importXml = function(xmlPath) {
        console.log('importing ' + xmlPath)
        var xml = readFile(xmlPath);
        var json = xmlToJson(parseXml(xml))
        try {
            workflowView.import(json);
            xml.toJSON();
        } catch (e) {
            console.log(e.stack);
            throw e;
        }
    }

    describe("Job_PI.xml", function() {

    it("should be possible to import", function() {
        var f = function() {importXml('tests/jobs/Job_PI.xml')}
        expect(f).not.toThrow();
    });

  });
//
//  // demonstrates use of spies to intercept and test method calls
//  it("tells the current song if the user has made it a favorite", function() {
//    spyOn(song, 'persistFavoriteStatus');
//
//    player.play(song);
//    player.makeFavorite();
//
//    expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
//  });
//
//  //demonstrates use of expected exceptions
//  describe("#resume", function() {
//    it("should throw an exception if song is already playing", function() {
//      player.play(song);
//
//      expect(function() {
//        player.resume();
//      }).toThrow("song is already playing");
//    });
//  });
});