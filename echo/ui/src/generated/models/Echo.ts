/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Represents an audio file that can be transcribed.
 */
export type Echo = {
  id: string;
  source_file_path: string;
  media_type: string;
  text: string;
};
