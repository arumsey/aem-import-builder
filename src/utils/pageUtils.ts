/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {minify} from 'html-minifier-terser';
import {DocumentUtils} from './documentUtils.js';
import {IGNORE_ELEMENTS} from '../constants/index.js';

export type PageCollection = [Document, string];

export type PageOptions = {
  page?: PageCollection
}

export const minifyPage = async (options: PageOptions = {}): Promise<PageCollection | []> => {
  try {
    const { page = [] } = options;
    const [pageDocument, pageScreenshot = ''] = page;
    if (!pageDocument) {
      return [];
    }

    const serializer = new XMLSerializer();
    let pageContent = serializer.serializeToString(pageDocument);

    pageContent = await minify(pageContent, {
      collapseWhitespace: true,
      removeComments: true,
      continueOnParseError: true,
      removeEmptyAttributes: true,
      removeEmptyElements: false,
      removeRedundantAttributes: true,
      removeOptionalTags: true,
    });

    const parser = new DOMParser();
    const document = parser.parseFromString(pageContent, 'text/html');

    // pre-process document
    DocumentUtils(document)
      .removeAttributes()
      .removeElements(IGNORE_ELEMENTS)
      .removeEmptyElements();

    return [document, pageScreenshot];

  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};
