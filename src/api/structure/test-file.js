const BORROWED_TEST_PROPERTIES = ['skip', 'only', 'pageUrl', 'authCredentials'];

export default class TestFile {
    constructor (filename) {
        this.filename       = filename;
        this.currentFixture = null;
        this.collectedTests = [];
    }

    _filterRecursiveProps () {
        for (const test of this.collectedTests)
            test.testFile = test.fixture.testFile = { filename: test.testFile.filename };
    }

    getTests () {
        this.collectedTests.forEach(test => {
            BORROWED_TEST_PROPERTIES.forEach(prop => {
                test[prop] = test[prop] || test.fixture[prop];
            });

            if (test.disablePageReloads === void 0)
                test.disablePageReloads = test.fixture.disablePageReloads;

            if (!test.disablePageCaching)
                test.disablePageCaching = test.fixture.disablePageCaching;
        });

        this._filterRecursiveProps();

        return this.collectedTests;
    }
}
