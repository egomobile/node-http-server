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

import { EntityTooLargeError } from './errors';
import type { HttpMiddleware, HttpRequestHandler, Nilable } from './types';

interface ICreateWithEntityTooLargeAction {
    action: HttpMiddleware;
    onLimitReached: HttpRequestHandler;
}

export function isNil(val: unknown): val is (null | undefined) {
    return val === null ||
        typeof val === 'undefined';
}

export function readStream(stream: NodeJS.ReadableStream) {
    const allChunks: Buffer[] = [];

    return new Promise<Buffer>((resolve, reject) => {
        stream.once('error', reject);

        stream.on('data', (chunk: Buffer) => {
            try {
                allChunks.push(chunk);
            } catch (error) {
                reject(error);
            }
        });

        stream.once('end', () => {
            try {
                resolve(Buffer.concat(allChunks));
            } catch (error) {
                reject(error);
            }
        });
    });
}

export function readStreamWithLimit(
    stream: NodeJS.ReadableStream,
    limit: Nilable<number>
) {
    const allChunks: Buffer[] = [];
    let currentSize = 0;

    const addChunkAndRecalc = (chunk: Buffer) => {
        allChunks.push(chunk);

        currentSize = allChunks.reduce(
            (currentSum, currentChunk) => currentSum + currentChunk.length,
            0
        );
    };

    let addChunk: (chunk: Buffer) => void;
    if (limit === null) {
        addChunk = (chunk) => addChunkAndRecalc(chunk);
    } else {
        addChunk = (chunk) => {
            if (currentSize + chunk.length > limit!) {
                throw new EntityTooLargeError();
            }

            addChunkAndRecalc(chunk);
        };
    }

    return new Promise<Buffer>((resolve, reject) => {
        stream.once('error', reject);

        stream.on('data', (chunk: Buffer) => {
            try {
                addChunk(chunk);
            } catch (error) {
                reject(error);
            }
        });

        stream.once('end', () => {
            try {
                resolve(Buffer.concat(allChunks));
            } catch (error) {
                reject(error);
            }
        });
    });
};

export function withEntityTooLarge(
    action: HttpMiddleware,
    onLimitReached: Nilable<HttpRequestHandler>
): HttpMiddleware {
    if (!onLimitReached) {
        onLimitReached = require('./middlewares').defaultLimitReachedHandler;
    }

    return createWithEntityTooLargeAction({
        action,
        onLimitReached: onLimitReached!
    });
}

function createWithEntityTooLargeAction({ action, onLimitReached }: ICreateWithEntityTooLargeAction) {
    return async (request, response, next) => {
        try {
            await action(request, response, next);
        } catch (error) {
            if (error instanceof EntityTooLargeError) {
                await onLimitReached(request, response);
            } else {
                throw error;
            }
        }
    };
}
