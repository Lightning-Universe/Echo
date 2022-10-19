/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type { BaseHttpRequest } from "../core/BaseHttpRequest";
import type { CancelablePromise } from "../core/CancelablePromise";
import type { Echo } from "../models/Echo";

export class AppApiService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Handle List Echoes
   * @param userId
   * @returns any Successful Response
   * @throws ApiError
   */
  public handleListEchoesApiEchoesGet(userId: string): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/echoes",
      query: {
        user_id: userId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Handle Create Echo
   * @param requestBody
   * @returns any Successful Response
   * @throws ApiError
   */
  public handleCreateEchoApiEchoesPost(requestBody: Echo): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/echoes",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Handle Get Echo
   * @param echoId
   * @param includeSegments
   * @returns any Successful Response
   * @throws ApiError
   */
  public handleGetEchoApiEchoesEchoIdGet(echoId: string, includeSegments: boolean): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/echoes/{echo_id}",
      path: {
        echo_id: echoId,
      },
      query: {
        include_segments: includeSegments,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Handle Delete Echo
   * @param echoId
   * @returns any Successful Response
   * @throws ApiError
   */
  public handleDeleteEchoApiEchoesEchoIdDelete(echoId: string): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "DELETE",
      url: "/api/echoes/{echo_id}",
      path: {
        echo_id: echoId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Handle Validate Echo
   * @param requestBody
   * @returns any Successful Response
   * @throws ApiError
   */
  public handleValidateEchoApiValidatePost(requestBody: Echo): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/validate",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Handle Login
   * @returns any Successful Response
   * @throws ApiError
   */
  public handleLoginApiLoginGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/login",
    });
  }
}
