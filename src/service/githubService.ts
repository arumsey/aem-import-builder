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

const GIST_IMPORT_RULES = 'a66e25a5292afcc0f34be48a84c8c548';
let fileCache: Record<string, GistFile> = {};

type GistFile = {
  filename: string;
  type: string;
  language: string;
  raw_url: string;
  size: number;
  truncated: boolean;
  content: string;
}

export const fetchGist = async (name: string): Promise<string | null> => {
  if (!fileCache[name]) {
    const gist = await fetch(`https://api.github.com/gists/${GIST_IMPORT_RULES}`);
    const {files} = await gist.json();
    fileCache = files as Record<string, GistFile>;
  }
  const {[name]: {content, truncated}} = fileCache;
  if (!truncated) {
    return content;
  }
  return null;
};
