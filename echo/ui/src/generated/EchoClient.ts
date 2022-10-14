/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type { BaseHttpRequest } from "./core/BaseHttpRequest";
import { FetchHttpRequest } from "./core/FetchHttpRequest";
import type { OpenAPIConfig } from "./core/OpenAPI";
import { AppApiService } from "./services/AppApiService";
import { AppClientCommandService } from "./services/AppClientCommandService";
import { DefaultService } from "./services/DefaultService";

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;

export class EchoClient {
  public readonly appApi: AppApiService;
  public readonly appClientCommand: AppClientCommandService;
  public readonly default: DefaultService;

  public readonly request: BaseHttpRequest;

  constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
    this.request = new HttpRequest({
      BASE: config?.BASE ?? "",
      VERSION: config?.VERSION ?? "0.1.0",
      WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
      CREDENTIALS: config?.CREDENTIALS ?? "include",
      TOKEN: config?.TOKEN,
      USERNAME: config?.USERNAME,
      PASSWORD: config?.PASSWORD,
      HEADERS: config?.HEADERS,
      ENCODE_PATH: config?.ENCODE_PATH,
    });

    this.appApi = new AppApiService(this.request);
    this.appClientCommand = new AppClientCommandService(this.request);
    this.default = new DefaultService(this.request);
  }
}
