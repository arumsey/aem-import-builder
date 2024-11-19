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

import { expect } from 'chai';
import { builderConfig } from '../src/config.js';

describe('builder config tests', () => {
  beforeEach(() => {
    builderConfig.mergeConfig({ baseUrl: '', apiKey: '', environment: 'prod' });
  });
  describe('getConfig tests', () => {
    it('should return default configuration', () => {
      const config = builderConfig.getConfig();
      expect(config).to.deep.equal({
        apiKey: '',
        baseUrl: '',
        environment: 'prod',
        githubUrl: 'https://api.github.com',
        spacecatUrl: 'https://spacecat.experiencecloud.live/api/v1',
      });
    });
    it('should return stage configuration', () => {
      builderConfig.mergeConfig({ environment: 'stage' });
      const config = builderConfig.getConfig();
      expect(config).to.deep.equal({
        apiKey: '',
        baseUrl: '',
        environment: 'stage',
        githubUrl: 'https://api.github.com',
        spacecatUrl: 'https://spacecat.experiencecloud.live/api/ci',
      });
    });
    it('should include api key', () => {
      builderConfig.mergeConfig({ apiKey: 'test-api-key' });
      const config = builderConfig.getConfig();
      expect(config).to.deep.equal({
        apiKey: 'test-api-key',
        baseUrl: '',
        environment: 'prod',
        githubUrl: 'https://api.github.com',
        spacecatUrl: 'https://spacecat.experiencecloud.live/api/v1',
      });
    });
    it('should include base url', () => {
      builderConfig.mergeConfig({ baseUrl: 'http://localhost:3001' });
      const config = builderConfig.getConfig();
      expect(config).to.deep.equal({
        apiKey: '',
        baseUrl: 'http://localhost:3001',
        environment: 'prod',
        githubUrl: 'https://api.github.com',
        spacecatUrl: 'https://spacecat.experiencecloud.live/api/v1',
      });
    });
  });

  describe('mergeConfig tests', () => {
    it('should merge new configuration with the existing one', () => {
      const newConfig = { baseUrl: 'https://localhost:3001', apiKey: 'test-api-key' };
      const mergedConfig = builderConfig.mergeConfig(newConfig);
      expect(mergedConfig).to.deep.equal({
        baseUrl: 'https://localhost:3001',
        apiKey: 'test-api-key',
        environment: 'prod',
      });
    });
  });
});
