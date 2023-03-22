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

export type ClassDecorator5 = (classFunction: any, context: ClassDecoratorContext) => any;

export type ClassFieldDecorator5 = (target: any, context: ClassFieldDecoratorContext) => any;

export type ClassMemberDecorator5 = (target: any, context: ClassMemberDecoratorContext) => any;

export type ClassMethodDecorator5 = (method: any, context: ClassMethodDecoratorContext) => any;

export type Constructor<T extends any = any> = (new (...args: any[]) => T);

export interface ITestAction {
    description: string;
    name: string;
    ref: TestRefValue;
    script: Nullable<string>;
}

export interface ITestDescription {
    name: string;
    script: Nullable<string>;
}

export type LazyValue<T extends any = any> = T | (() => T);

export type ObjectKey = string | number | symbol;

export type Optional<T extends any = any> = T | undefined;

export type Nilable<T extends any = any> = Optional<T> | Nullable<T>;

export type Nullable<T extends any = any> = T | null;

export type TestRefValue = string | number | symbol;
