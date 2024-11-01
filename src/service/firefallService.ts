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

export const IMS = {
  URL: 'https://ims-na1-stg1.adobelogin.com',
  CLIENT_ID: 'aem-import-as-a-service',
  ORG_ID: '154340995B76EEF60A494007@AdobeOrg',
  CLIENT_SECRET: '',
  AUTH_CODE: '',
  ACCESS_TOKEN: '',
};

const FIREFALL = Object.freeze({
  URL: 'https://firefall-stage.adobe.io',
});

type FireFallContent = {
  type: 'text' | 'image_url',
  text?: string,
  image_url?: { url: string}
};

export type FirefallMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | FireFallContent[];
};

export type FirefallPayload = {
  llm_metadata: {
    model_name: 'gpt-35-turbo' | 'gpt-35-turbo-1106' | 'gpt-35-turbo-16k' | 'gpt-4' | 'gpt-4-turbo' | 'gpt-4-vision',
    llm_type: 'azure_chat_openai'
  },
  response_format?: {
    type: 'json_object'
  },
  messages: FirefallMessage[]
};

export type FirefallChoice = {
  finish_reason?: 'stop',
  message: FirefallMessage
};

export type FirefallResponse = {
  conversation_identifier: string | null,
  query_id: string | null,
  model: string,
  choices: FirefallChoice[]
};

export const firefallJsonPayload: FirefallPayload = {
  llm_metadata: {
    model_name: 'gpt-4-turbo',
    llm_type: 'azure_chat_openai',
  },
  response_format: {
    type: 'json_object',
  },
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant designed to output JSON.',
    },
  ],
};

export const firefallPayload: FirefallPayload = {
  llm_metadata: {
    model_name: 'gpt-4-turbo',
    llm_type: 'azure_chat_openai',
  },
  messages: [],
};

export const firefallVisionPayload: FirefallPayload = {
  llm_metadata: {
    model_name: 'gpt-4-vision',
    llm_type: 'azure_chat_openai',
  },
  messages: [],
};

export const javascriptRegex = /```javascript([\s\S]*?)```/g;
export const jsonRegex = /```json([\s\S]*?)```/g;

const fetchToken = async () => {
  const formData: FormData = new FormData();
  formData.append('client_id', IMS.CLIENT_ID);
  formData.append('client_secret', IMS.CLIENT_SECRET);
  formData.append('code', IMS.AUTH_CODE);
  formData.append('grant_type', 'authorization_code');
  const response = await fetch(`${IMS.URL}/ims/token/v4`, {
    method: 'POST',
    body: formData,
  });
  const { access_token } = await response.json();
  return access_token as string;
}

export const fetchChatCompletion = async <T>(payload: FirefallPayload): Promise<T> => {
  const accessToken = IMS.ACCESS_TOKEN ? IMS.ACCESS_TOKEN : await fetchToken();
  const firefall = await fetch(`${FIREFALL.URL}/v2/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'x-api-key': IMS.CLIENT_ID,
      'x-gw-ims-org-id': IMS.ORG_ID,
    },
    body: JSON.stringify(payload),
  });
  return await firefall.json() as T;
};

export const reduceFirefallResponse = <T = unknown>(
  response: FirefallResponse,
  initialValue: T,
  messageParser: (content: string, value: T) => T = (content) => content as T,
): T => {
  const {choices = []} = response;
  return choices.reduce((value, {finish_reason, message}): T => {
    if (finish_reason === 'stop' && typeof message.content === 'string') {
      value = messageParser(message.content, value) || value;
    }
    return value;
  }, initialValue);
}

export const reduceFirefallScriptResponse = (response: FirefallResponse) => {
  return reduceFirefallResponse(response, [] as string[], (content, scripts) => {
    const matches = content.matchAll(javascriptRegex);
    [...matches].forEach((match) => {
      const [, javascript ] = match;
      scripts.push(javascript);
    });
    return scripts;
  });
}
