/* eslint-disable @typescript-eslint/naming-convention */

import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
    "input": "src/index.ts",
    "output": [
        {
            "file": "lib/index.esm.js",
            "format": "esm",
            "sourcemap": false
        },
        {
            "file": "lib/index.cjs.js",
            "format": "cjs",
            "sourcemap": false
        }
    ],
    "plugins": [
        typescript({
            "exclude": ["**/__tests__", "**/*.test.ts", "node_modules"]
        }),
        nodeResolve(),
        commonjs(),
        json()
    ]
};