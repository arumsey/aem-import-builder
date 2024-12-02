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

export type EndpointConfig = {
  spacecatUrl: string;
  githubUrl: string;
  firefallUrl: string;
  imsUrl: string;
}

export type EndpointEnvironment = keyof EndpointDictionary;

type EndpointDictionary = Record<'prod' | 'stage', EndpointConfig>;

const baseConfig: EndpointConfig = {
  spacecatUrl: 'https://spacecat.experiencecloud.live/api/v1',
  githubUrl: 'https://api.github.com',
  firefallUrl: 'https://firefall-stage.adobe.io',
  imsUrl: 'https://ims-na1-stg1.adobelogin.com',
};

export const endpointMap: EndpointDictionary = Object.freeze({
  prod: {
    ...baseConfig,
  },
  stage: {
    ...baseConfig,
    spacecatUrl: 'https://spacecat.experiencecloud.live/api/ci',
  },
});
