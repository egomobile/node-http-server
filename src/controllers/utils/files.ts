// This file is part of the @egomobile/http-server distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-server is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-server is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import path from "path";
import type { IControllerFile, Nilable } from "../../types/internal";
import { multiSort } from "../../utils";

const safePathSep = "/";

function getSafePath(input: string): string {
    return input.replaceAll(path.sep, safePathSep);
}

function getSortValueByItemName(itemName: Nilable<string>): number {
    return !!itemName?.toLowerCase().trim().startsWith("@") ?
        Number.MAX_SAFE_INTEGER :
        Number.MIN_SAFE_INTEGER;
}

export function sortControllerFiles(files: IControllerFile[]): IControllerFile[] {
    return multiSort(
        files,

        // first: by number of parts, separated by path chars like `/`
        (file) => {
            const filePath = getSafePath(file.relativePath);
            const filePathParts = filePath.split(safePathSep);

            return filePathParts.length;
        },

        // then: all directories, starting with `@`, will be moved to the bottom
        (file) => {
            const filePath = getSafePath(file.relativePath);
            const dirName = path.dirname(filePath);
            const dirNameParts = dirName.split(safePathSep);
            const lastPart = dirNameParts[dirNameParts.length - 1];

            return getSortValueByItemName(lastPart);
        },

        // then: by directory path (case-insensitive)
        (file) => {
            const filePath = getSafePath(file.relativePath);
            const dirName = path.dirname(filePath);

            return dirName.toLowerCase().trim();
        },

        // then: all files, starting with `@`, will be moved to the bottom
        (file) => {
            const filePath = getSafePath(file.relativePath);
            const filePathParts = filePath.split(safePathSep);
            const lastPart = filePathParts[filePathParts.length - 1];

            return getSortValueByItemName(lastPart);
        },

        // then: by file name (case-insensitive)
        (file) => {
            const filePath = getSafePath(file.relativePath);
            const filePathParts = filePath.split(safePathSep);
            const lastPart = filePathParts[filePathParts.length - 1];

            return lastPart?.toLowerCase().trim();
        }
    );
}
