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

import esmock from 'esmock';
import { expect } from 'chai';
import sinon from 'sinon';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { builderConfig } from '../../src/config.js';
import {
  AssistantPayload,
  AssistantResponse,
} from '../../src/service/assistantService.js';

chai.use(chaiAsPromised);

describe('assistantService tests', () => {
  let fetchStub: sinon.SinonStub;
  let getConfigStub: sinon.SinonStub;
  let assistantServiceMock: typeof import('../../src/service/assistantService.js');

  beforeEach(async () => {
    fetchStub = sinon.stub(global, 'fetch');
    getConfigStub = sinon.stub(builderConfig, 'getConfig').returns({
      spacecatUrl: 'https://spacecat.experiencecloud.live/api/v1',
      apiKey: 'test-api-key',
    } as ReturnType<typeof builderConfig.getConfig>);

    assistantServiceMock = await esmock('../../src/service/assistantService.js', {
      '../../src/config.js': {
        builderConfig: {
          getConfig: getConfigStub,
        },
      },
    }, {
      import: {
        fetch: fetchStub,
      },
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('fetchPromptCompletion tests', () => {
    it('should call assistant service with correct payload', async () => {
      const payload: AssistantPayload = { command: 'findMainContent' };
      const response = { choices: [] };
      fetchStub.resolves(new Response(JSON.stringify(response)));

      const { fetchPromptCompletion } = assistantServiceMock;
      const result = await fetchPromptCompletion(payload);
      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.args[0][0]).to.equal('https://spacecat.experiencecloud.live/api/v1/tools/import/assistant/prompt');
      expect(fetchStub.args[0][1].method).to.equal('POST');
      expect(fetchStub.args[0][1].headers['x-api-key']).to.equal('test-api-key');
      expect(fetchStub.args[0][1].body).to.equal(JSON.stringify(payload));
      expect(result).to.deep.equal(response);
    });

    it('should call assistant service with correct full payload', async () => {
      const payload: AssistantPayload = {
        command: 'findBlockSelectors',
        prompt: 'Test prompt',
        options: { imageUrl: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8' },
      };
      const response = { choices: [] };
      fetchStub.resolves(new Response(JSON.stringify(response)));

      const { fetchPromptCompletion } = assistantServiceMock;
      const result = await fetchPromptCompletion(payload);
      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.args[0][1].body).to.equal(JSON.stringify(payload));
      expect(result).to.deep.equal(response);
    });

    it('should throw an error if fetch fails', async () => {
      fetchStub.rejects(new Error('Fetch failed'));
      const payload: AssistantPayload = { command: 'findMainContent' };
      const { fetchPromptCompletion } = assistantServiceMock;
      await expect(fetchPromptCompletion(payload)).to.be.rejectedWith('Fetch failed');
    });
  });

  describe('reduceAssistantResponse', () => {
    it('should reduce assistant response correctly', () => {
      const response: AssistantResponse = {
        choices: [
          { finish_reason: 'stop', message: { role: 'assistant', content: 'Test content' } },
        ],
      };
      const { reduceAssistantResponse } = assistantServiceMock;
      const result = reduceAssistantResponse(response, '', (content) => content);
      expect(result).to.equal('Test content');
    });

    it('should return initial value if no choices are present', () => {
      const response: AssistantResponse = { choices: [] };
      const { reduceAssistantResponse } = assistantServiceMock;
      const result = reduceAssistantResponse(response, 'initial', (content) => content);
      expect(result).to.equal('initial');
    });
  });

  describe('reduceAssistantScriptResponse', () => {
    it('should extract JavaScript code blocks from response', () => {
      const response: AssistantResponse = {
        choices: [
          { finish_reason: 'stop', message: { role: 'assistant', content: '```javascript\nconsole.log("test");\n```' } },
        ],
      };
      const { reduceAssistantScriptResponse } = assistantServiceMock;
      const result = reduceAssistantScriptResponse(response);
      expect(result).to.deep.equal(['\nconsole.log("test");\n']);
    });

    it('should return an empty array if no JavaScript code blocks are found', () => {
      const response: AssistantResponse = { choices: [] };
      const { reduceAssistantScriptResponse } = assistantServiceMock;
      const result = reduceAssistantScriptResponse(response);
      expect(result).to.deep.equal([]);
    });
  });
});
