import type { IHttp1Server, IHttp2Server } from "@egomobile/http-server";
import type { Response } from "supertest";

export function binaryParser(response: Response, done: (ex: any, data?: Buffer) => any) {
    response.setEncoding("binary");

    let data = "";

    response.once("error", (error: any) => {
        done(error);
    });

    response.on("data", (chunk: string) => {
        data += chunk;
    });

    response.once("end", () => {
        done(null, Buffer.from(data, "binary"));
    });
}

export function getServers() {
    return {
        "httpServer1": (global as any).httpServer1 as IHttp1Server,
        "httpServer2": (global as any).httpServer2 as IHttp2Server
    };
}
