class MockGitHubQueryAdapter {
  constructor() {
    // class variable, since we can't get to the instance
    this.constructor.repoArrays = [];
  }

  getRepoData(repoArray, callback) {
    this.constructor.repoArrays.push(repoArray);
    callback(repoArray);
  }

  static getRepoArrays() {
    return this.repoArrays;
  }
}

module.exports = MockGitHubQueryAdapter;