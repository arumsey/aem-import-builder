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
  FirefallResponse,
  FirefallPayload,
  firefallPayload,
  reduceFirefallScriptResponse,
} from '../service/firefallService.js';

async function findBlockCells(content: string, screenshot: string, selectors: string[], pattern: string): Promise<string[]> {
  if (!selectors.length || !pattern || !screenshot) {
    return [];
  }
  // Just use first selector for now - TODO: handle multiple selectors in the future
  const [selector] = selectors;
  const prompt = await TemplateBuilder.merge('/templates/prompt-cells.hbs', {selector, pattern, content});
  const payload: FirefallPayload = { ...firefallPayload };
  payload.messages.push({ role: 'user', content: [
    { type: 'text', text: prompt },
  ]});
  const response = await fetchChatCompletion<FirefallResponse>(payload);
  return reduceFirefallScriptResponse(response);
}

export default findBlockCells;
