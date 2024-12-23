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

import Handlebars from 'handlebars';
import { fetchGist } from './service/githubService.js';
import { fetchText } from './service/toolsService.js';

Handlebars.registerHelper('title', (str: string) => {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
});

function mergeContent<T extends Record<string, unknown>>(template: string, data: T): string {
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(data);
}

const TemplateBuilder = {
  merge: async <T extends Record<string, unknown>>(template: string, data: T, options?: { variant: 'gist' | 'local' }): Promise<string> => {
    const { variant = 'local' } = options || {};
    let content: string;
    if (variant === 'gist') {
      content = await fetchGist(template) || '';
    } else {
      // Load the template file
      content = await fetchText(template);
    }
    return mergeContent(content, data);
  },
}

export default TemplateBuilder;
