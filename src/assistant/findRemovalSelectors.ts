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

import TemplateBuilder from '../templateBuilder.js';
import {
  fetchChatCompletion,
  firefallJsonPayload,
  FirefallResponse,
  FirefallPayload,
  reduceFirefallResponse,
} from '../service/firefallService.js';

function extractStrings(obj: Record<string, string>): string[] {
  return Object.values(obj).flatMap((value) =>
    typeof value === 'object' ? extractStrings(value) : value,
  );
}

async function findRemovalSelectors(content: string, names: string): Promise<string[]> {
  const prompt = await TemplateBuilder.merge('/templates/prompt-elements.hbs', {names, content});
  const payload: FirefallPayload = { ...firefallJsonPayload, messages: [...firefallJsonPayload.messages, { role: 'user', content: prompt }] };
  const response = await fetchChatCompletion<FirefallResponse>(payload);
  return reduceFirefallResponse(response, [] as string[], (content, selectors) => {
    const result = JSON.parse(content);
    return [...selectors, ...extractStrings(result)];
  });
}

export default findRemovalSelectors;
