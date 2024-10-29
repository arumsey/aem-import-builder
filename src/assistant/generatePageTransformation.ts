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
  FirefallJsonResponse,
  FirefallPayload,
  firefallPayload,
} from '../service/firefallService.js';

const javascriptRegex = /```javascript([\s\S]*?)```/g;

async function generatePageTransformation(content: string, pattern: string): Promise<string[]> {
  if (!pattern) {
    return [];
  }
  const prompt = await TemplateBuilder.merge('/templates/prompt-transform.hbs', {pattern, content});
  const payload: FirefallPayload = { ...firefallPayload };
  payload.messages.push({ role: 'user', content: [
    { type: 'text', text: prompt },
  ]});
  const response = await fetchChatCompletion<FirefallJsonResponse>(payload);
  const {choices = []} = response;
  return choices.reduce((parsers, {finish_reason, message}): string[] => {
    if (finish_reason === 'stop' && typeof message.content === 'string') {
      const matches = message.content.matchAll(javascriptRegex);
      [...matches].forEach((match) => {
        const [, javascript ] = match;
        parsers.push(javascript);
      });
    }
    return parsers;
  }, [] as string[]);
}

export default generatePageTransformation;
