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

import { BlockRule } from 'aem-import-rules';
import TemplateBuilder from '../templateBuilder.js';
import {
  fetchChatCompletion,
  FirefallResponse,
  FirefallPayload,
  firefallVisionPayload,
  reduceFirefallResponse,
  jsonRegex,
} from '../service/firefallService.js';

async function findBlockSelectors(content: string, screenshot: string, pattern: string): Promise<Partial<BlockRule>[]> {
  if (!pattern || !screenshot) {
    return [];
  }
  const prompt = await TemplateBuilder.merge('/templates/prompt-block.hbs', {pattern, content});
  const payload: FirefallPayload = { ...firefallVisionPayload };
  payload.messages.push({ role: 'user', content: [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: `data:image/png;base64,${screenshot}` } },
  ] });
  const response = await fetchChatCompletion<FirefallResponse>(payload);
  // extract selectors from response
  return reduceFirefallResponse(response, [{selectors: []}] as Partial<BlockRule>[], (content, rules) => {
    const matches = content.matchAll(jsonRegex);
    const [blockRule] = rules;
    [...matches].forEach((match) => {
      const [, json ] = match;
      const selectors = JSON.parse(json);
      blockRule.selectors = [...blockRule.selectors || [], ...selectors];
    });
    return rules;
  });
}

export default findBlockSelectors;
