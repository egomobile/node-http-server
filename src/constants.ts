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

export const CONTROLLERS_CONTEXES = Symbol('CONTROLLERS_CONTEXES');
export const CONTROLLER_MIDDLEWARES = Symbol('CONTROLLER_MIDDLEWARES');
export const DOCUMENTATION_UPDATER = Symbol('DOCUMENTATION_UPDATER');
export const ERROR_HANDLER = Symbol('ERROR_HANDLER');
export const HTTP_METHODS = Symbol('HTTP_METHODS');
export const INIT_CONTROLLER_METHOD_ACTIONS = Symbol('INIT_CONTROLLER_METHOD_ACTIONS');
export const INIT_CONTROLLER_METHOD_SWAGGER_ACTIONS = Symbol('INIT_CONTROLLER_METHOD_SWAGGER_ACTIONS');
export const IS_CONTROLLER_CLASS = Symbol('IS_CONTROLLER_CLASS');
export const RESPONSE_SERIALIZER = Symbol('RESPONSE_SERIALIZER');
export const ROUTER_PATHS = Symbol('ROUTER_PATHS');
export const SETUP_DOCUMENTATION_UPDATER = Symbol('SETUP_DOCUMENTATION_UPDATER');
export const SETUP_ERROR_HANDLER = Symbol('SETUP_ERROR_HANDLER');
export const SETUP_IMPORTS = Symbol('SETUP_IMPORTS');
export const SETUP_RESPONSE_SERIALIZER = Symbol('SETUP_RESPONSE_SERIALIZER');
export const SETUP_VALIDATION_ERROR_HANDLER = Symbol('SETUP_VALIDATION_ERROR_HANDLER');
export const SWAGGER_METHOD_INFO = Symbol('SWAGGER_METHOD_INFO');
export const VALIDATION_ERROR_HANDLER = Symbol('VALIDATION_ERROR_HANDLER');

export const httpMethodsWithBodies = ['POST', 'PUT', 'PATCH'];

export const knownFileMimes: Record<string, string> = {
    '.css': 'text/css; charset=UTF-8',
    '.html': 'text/html; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png'
};
