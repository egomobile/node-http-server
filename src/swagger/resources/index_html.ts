/* eslint-disable unicorn/filename-case */

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

import fs from 'fs';
import path from 'path';

const indexHtmlFilePath = path.join(
    require('swagger-ui-dist').absolutePath(),
    'index.html'
);

export default (): string => {
    const template = fs.readFileSync(indexHtmlFilePath, 'utf8');

    const oldLines = template.split('\n');

    const newLines: string[] = [];
    let linesToSkip = 0;
    for (const l of oldLines) {
        if (linesToSkip > 0) {
            --linesToSkip;
            continue;
        }

        if (l.trim().startsWith('window.ui = ui')) {
            // code to remove URL text field

            newLines.push(l);
            newLines.push('document.querySelector(\'#swagger-ui .topbar-wrapper .download-url-wrapper\').remove()');
        } else if (l.trim().startsWith('const ui = SwaggerUIBundle({')) {
            // change URL

            newLines.push(l);
            newLines.push('url: \'./json\',');

            linesToSkip = 1;
        } else {
            newLines.push(l);
        }
    }

    return newLines.join('\n');
};
