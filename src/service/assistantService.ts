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

import { builderConfig } from '../config.js';

export type AssistantCommands =
  'findMainContent' |
  'findRemovalSelectors' |
  'findBlockSelectors' |
  'findBlockCells' |
  'generatePageTransformation';

export type AssistantPayload = {
  command: AssistantCommands;
  prompt?: string;
  options?: {
    imageUrl: string;
  }
};

export type AssistantMessage = {
  role: 'assistant';
  content: string;
};

export type AssistantChoice = {
  finish_reason?: 'stop',
  message: AssistantMessage
};

export type AssistantResponse = {
  choices: AssistantChoice[]
};

export const javascriptRegex = /```javascript([\s\S]*?)```/g;
export const jsonRegex = /```json([\s\S]*?)```/g;

export const fetchPrompt = async <T>(payload: AssistantPayload): Promise<T> => {
  const { spacecatUrl, apiKey } = builderConfig.getConfig();
  const assistant = await fetch(`${spacecatUrl}/tools/import/assistant/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });
  return await assistant.json() as T;
};

export const reduceAssistantResponse = <T = unknown>(
  response: AssistantResponse,
  initialValue: T,
  messageParser: (content: string, value: T) => T = (content) => content as T,
): T => {
  const { choices = [] } = response;
  return choices.reduce((value, { finish_reason, message }): T => {
    if (finish_reason === 'stop' && typeof message.content === 'string') {
      value = messageParser(message.content, value) || value;
    }
    return value;
  }, initialValue);
}

export const reduceAssistantScriptResponse = (response: AssistantResponse) => {
  return reduceAssistantResponse(response, [] as string[], (content, scripts) => {
    const matches = content.matchAll(javascriptRegex);
    [...matches].forEach((match) => {
      const [, javascript ] = match;
      scripts.push(javascript);
    });
    return scripts;
  });
}
