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
import {
  AssistantPayload,
  AssistantResponse,
  fetchPromptCompletion,
  jsonRegex,
} from '../service/assistantService.js';
import { reduceAssistantResponse } from '../service/firefallService.js';

async function findBlockSelectors(content: string, screenshot: string, prompt: string): Promise<Partial<BlockRule>[]> {
  if (!prompt || !screenshot) {
    return [];
  }
  const payload: AssistantPayload = {
    command: 'findBlockSelectors',
    prompt,
    htmlContent: content,
    imageUrl: `data:image/png;base64,${screenshot}`,
  };
  const response = await fetchPromptCompletion<AssistantResponse>(payload);
  // extract selectors from response
  return reduceAssistantResponse(response, [{ selectors: [] }] as Partial<BlockRule>[], (content, rules) => {
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
