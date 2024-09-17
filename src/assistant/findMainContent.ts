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

import {
  fetchChatCompletion,
  firefallJsonPayload,
  FirefallPayload,
  FirefallJsonResponse,
} from '../service/firefallService.js';
import TemplateBuilder from '../templateBuilder.js';

async function findMainContent(content: string): Promise<string> {
  const prompt = await TemplateBuilder.merge('/templates/prompt-mainContent.hbs', {content});
  const payload: FirefallPayload = { ...firefallJsonPayload, messages: [...firefallJsonPayload.messages, { role: 'user', content: prompt }] };
  const response = await fetchChatCompletion<FirefallJsonResponse>(payload);
  const {choices = []} = response;
  return choices.reduce((selector, {finish_reason, message}): string => {
    if (finish_reason === 'stop' && typeof message.content === 'string') {
      const result = JSON.parse(message.content);
      const [firstValue] = Object.values<string>(result);
      return firstValue;
    }
    return selector;
  }, 'main');
}

export default findMainContent;
