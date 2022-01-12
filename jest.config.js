/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'

const tsPreset = require('ts-jest/jest-preset')

module.exports = {
    ...tsPreset,
    collectCoverage: false,
    collectCoverageFrom: ['src/**/*.ts', 'src/**/*.js'],
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0,
        },
    },
    // testMatch: ['src/__tests__/**/*.ts'],
    testEnvironment: 'node',
    // ? preset: 'ts-jest',
}