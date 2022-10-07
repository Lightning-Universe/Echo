/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type { BaseHttpRequest } from "../core/BaseHttpRequest";
import type { CancelablePromise } from "../core/CancelablePromise";
import type { Body_upload_file_api_v1_upload_file__filename__put } from "../models/Body_upload_file_api_v1_upload_file__filename__put";

export class DefaultService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Get State
   * @param xLightningType
   * @param xLightningSessionUuid
   * @param xLightningSessionId
   * @returns any Successful Response
   * @throws ApiError
   */
  public getStateApiV1StateGet(
    xLightningType?: string,
    xLightningSessionUuid?: string,
    xLightningSessionId?: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/state",
      headers: {
        "x-lightning-type": xLightningType,
        "x-lightning-session-uuid": xLightningSessionUuid,
        "x-lightning-session-id": xLightningSessionId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Post State
   * @param xLightningType
   * @param xLightningSessionUuid
   * @param xLightningSessionId
   * @returns any Successful Response
   * @throws ApiError
   */
  public postStateApiV1StatePost(
    xLightningType?: string,
    xLightningSessionUuid?: string,
    xLightningSessionId?: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/state",
      headers: {
        "x-lightning-type": xLightningType,
        "x-lightning-session-uuid": xLightningSessionUuid,
        "x-lightning-session-id": xLightningSessionId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Get Spec
   * @param xLightningSessionUuid
   * @param xLightningSessionId
   * @returns any Successful Response
   * @throws ApiError
   */
  public getSpecApiV1SpecGet(xLightningSessionUuid?: string, xLightningSessionId?: string): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/spec",
      headers: {
        "x-lightning-session-uuid": xLightningSessionUuid,
        "x-lightning-session-id": xLightningSessionId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Post Delta
   * This endpoint is used to make an update to the app state using delta diff, mainly used by streamlit to
   * update the state.
   * @param xLightningType
   * @param xLightningSessionUuid
   * @param xLightningSessionId
   * @returns any Successful Response
   * @throws ApiError
   */
  public postDeltaApiV1DeltaPost(
    xLightningType?: string,
    xLightningSessionUuid?: string,
    xLightningSessionId?: string,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/delta",
      headers: {
        "x-lightning-type": xLightningType,
        "x-lightning-session-uuid": xLightningSessionUuid,
        "x-lightning-session-id": xLightningSessionId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Upload File
   * @param filename
   * @param formData
   * @returns any Successful Response
   * @throws ApiError
   */
  public uploadFileApiV1UploadFileFilenamePut(
    filename: string,
    formData: Body_upload_file_api_v1_upload_file__filename__put,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "PUT",
      url: "/api/v1/upload_file/{filename}",
      path: {
        filename: filename,
      },
      formData: formData,
      mediaType: "multipart/form-data",
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Healthz
   * Health check endpoint used in the cloud FastAPI servers to check the status periodically. This requires
   * Redis to be installed for it to work.
   *
   * # TODO - Once the state store abstraction is in, check that too
   * @returns any Successful Response
   * @throws ApiError
   */
  public healthzHealthzGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "GET",
      url: "/healthz",
    });
  }

  /**
   * Api Catch All
   * @param fullPath
   * @returns any Successful Response
   * @throws ApiError
   */
  public apiCatchAllApiFullPathGet(fullPath: string): CancelablePromise<any> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api{full_path}",
      path: {
        full_path: fullPath,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Frontend Route
   * @param fullPath
   * @returns string Successful Response
   * @throws ApiError
   */
  public frontendRouteFullPathGet(fullPath: string): CancelablePromise<string> {
    return this.httpRequest.request({
      method: "GET",
      url: "/{full_path}",
      path: {
        full_path: fullPath,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
}
