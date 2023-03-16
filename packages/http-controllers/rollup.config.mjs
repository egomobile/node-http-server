

/* eslint-disable @typescript-eslint/naming-convention */

import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
    "input": "src/index.ts",
    "output": [
        {
            "file": "lib/index.mjs",
            "format": "esm",
            "sourcemap": false,
            "exports": "named"
        },
        {
            "file": "lib/index.cjs",
            "format": "cjs",
            "sourcemap": false,
            "exports": "named"
        }
    ],
    "plugins": [
        typescript({
            "compilerOptions": {
                "moduleResolution": "nodenext"
            },
            "exclude": ["**/__tests__", "**/*.test.ts", "node_modules", "sandbox"]
        }),
        nodeResolve(),
        commonjs(),
        json()
    ]
};