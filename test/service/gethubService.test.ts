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

chai.use(chaiAsPromised);

describe('githubService tests', () => {
  let fetchStub: sinon.SinonStub;
  let getConfigStub: sinon.SinonStub;
  let githubServiceMock: typeof import('../../src/service/githubService.js');

  beforeEach(async () => {
    fetchStub = sinon.stub(global, 'fetch');
    getConfigStub = sinon.stub(builderConfig, 'getConfig').returns({
      githubUrl: 'https://api.github.com',
    } as ReturnType<typeof builderConfig.getConfig>);

    githubServiceMock = await esmock('../../src/service/githubService.js', {
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

  describe('fetchGist tests', () => {
    it('should fetch gist content with correct URL', async () => {
      const gistContent = {
        files: {
          'testFile': {
            filename: 'testFile',
            type: 'text/plain',
            language: 'Text',
            raw_url: 'https://gist.githubusercontent.com/raw/testFile',
            size: 10,
            truncated: false,
            content: 'Test content',
          },
        },
      };
      fetchStub.resolves(new Response(JSON.stringify(gistContent)));

      const { fetchGist } = githubServiceMock;
      const result = await fetchGist('testFile');
      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.args[0][0]).to.equal('https://api.github.com/gists/a66e25a5292afcc0f34be48a84c8c548');
      expect(result).to.equal('Test content');
    });

    it('should return null if gist content is truncated', async () => {
      const gistContent = {
        files: {
          'testFile': {
            filename: 'testFile',
            type: 'text/plain',
            language: 'Text',
            raw_url: 'https://gist.githubusercontent.com/raw/testFile',
            size: 10,
            truncated: true,
            content: 'Test content',
          },
        },
      };
      fetchStub.resolves(new Response(JSON.stringify(gistContent)));

      const { fetchGist } = githubServiceMock;
      const result = await fetchGist('testFile');
      expect(fetchStub.calledOnce).to.be.true;
      expect(result).to.be.null;
    });

    it('should throw an error if fetch fails', async () => {
      fetchStub.rejects(new Error('Fetch failed'));
      const { fetchGist } = githubServiceMock;
      await expect(fetchGist('testFile')).to.be.rejectedWith('Fetch failed');
    });
  });
});
