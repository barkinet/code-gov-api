const StreamTest = require("streamtest");
const proxyquire = require("proxyquire");
const MockGitHubQueryAdapter = require("./mock_github_query_adapter");
const expect     = require('chai').expect;

describe("RepoDecorator stream", () => {
  StreamTest.versions.forEach(function(version) {
    describe("for " + version + "streams", () => {

      var RepoDecoratorStream = proxyquire("../../../services/repo_decorator", {
        "./github_query_adapter": MockGitHubQueryAdapter
      });
    
      it("queries in batches of BATCH_SIZE", done => {
        var repoDecoratorStream = new RepoDecoratorStream({
          "logger": null
        });
        var ras = repoArrays(repoDecoratorStream.getBatchSize());
        // flatten into a single array of objects
        var flat_ras = [].concat.apply([], ras);

        StreamTest[version]
          .fromObjects(flat_ras)
          .pipe(repoDecoratorStream)
          .pipe(
            StreamTest[version].toObjects(function(err, objects) {
              if (err) {
                done(err);
              }
              expect(MockGitHubQueryAdapter.getRepoArrays()).to.deep.equal(ras);
              done();
            })
          );
      });
    });
  });
});

// Create a large set of objects to test with, as an array of arrays
function repoArrays(batchsize) {
  // we want a set at the end that's smaller than a batch
  var o = {};
  return [ new Array(batchsize).fill(o),
           new Array(batchsize).fill(o),
           new Array(Math.floor(batchsize/2)).fill(o) ];
}
