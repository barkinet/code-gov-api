const Transform           = require("stream").Transform;
const _                   = require("lodash");
const GitHubQueryAdapter  = require("./github_query_adapter");

// Number of repos to include in each GitHub GraphQL query.
// This should be calculated to max out the size of a query
// without hitting the API limit. 
// To do this, look at 
// https://developer.github.com/v4/guides/resource-limitations/ ,
// particularly the maximum total node count for a single query
// (11,250 at time of writing). Divide this number by the total number
// of nodes returned by our Repository Fragment (see the GitHub Query
// Adapter), then round it down with some extra room, and that should
// give you the number of repos to include in a single batch.
const BATCH_SIZE = 2;

class RepoDecoratorStream extends Transform {

  constructor(repoIndexer) {
    super({objectMode: true});
    this.repoIndexer = repoIndexer;
    this.logger = repoIndexer.logger;
    this.githubQueryAdapter = new GitHubQueryAdapter();
    this.batch = [];
  }

  getBatchSize() {
    return BATCH_SIZE;
  }

  _transform(repo, enc, callback) {
    this.batch.push(repo);

    if (this.batch.length === BATCH_SIZE || repo === null ) {
      this._decorateRepoBatch(callback);
    } else {
      callback();
    }
  }

  _flush(callback) {
    this._decorateRepoBatch(callback);
  }

  _repoLocators(repos) {
    this.batch.map(r => {
      new Object({
        "name": r.repository,
        "owner": r.agency
      });
    });
  }

  _decorateRepoBatch(callback) {
    this.githubQueryAdapter.getRepoData(this.batch, repos => {
      repos.forEach(repo => {
        this.push(repo);
      });
      this.batch = [];
      callback();
    });
  }

}

module.exports = RepoDecoratorStream;