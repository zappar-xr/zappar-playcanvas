module.exports = {
    "roots": [
        "<rootDir>/tests"
    ],
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    "testRegex": "(.*|(\\.|/)(test|spec))\\.tsx?$",
    "testPathIgnorePatterns": ["./tests/util.ts"],
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json",
        "node"
    ],
    "preset": "jest-puppeteer"
}
