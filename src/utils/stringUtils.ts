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

/**
 * Stringify an object for inclusion in a template.
 * @param json
 */
export function stringifyObject(json: Record<string, unknown>): string {
  // Use JSON.stringify with a replacer to control the formatting
  let jsonString = JSON.stringify(json, (key, value) => {
    // Wrap strings in single quotes
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    return value;
  }, 2);

  // Remove quotes around object keys
  jsonString = jsonString.replace(/"(\w+)":/g, '$1:');

  // Replace double quotes around strings with single quotes
  jsonString = jsonString.replace(/"('.*?')"/g, '$1');

  return jsonString;
}
