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
import ImportBuilderFactory from '../src/importBuilderFactory.js';

describe('ImportBuilderFactory', () => {
  let fetchDocumentStub: sinon.SinonStub;
  let importEventsOnStub: sinon.SinonStub;
  let importEventsOffStub: sinon.SinonStub;
  let factory: ReturnType<typeof ImportBuilderFactory>;

  beforeEach(async () => {
    fetchDocumentStub = sinon.stub();
    importEventsOnStub = sinon.stub();
    importEventsOffStub = sinon.stub();

    const ImportBuilderFactoryMock = await esmock('../src/importBuilderFactory.js', {
      '../src/service/documentService.js': {
        fetchDocument: fetchDocumentStub,
      },
      '../src/events.js': {
        importEvents: {
          on: importEventsOnStub,
          off: importEventsOffStub,
        },
      }
    });

    factory = ImportBuilderFactoryMock();

    const doc = '<html></html>';
    fetchDocumentStub.resolves(doc);

  });

  afterEach(() => {
    sinon.restore();
  });

  it('should create an ImportBuilder with script mode', async () => {
    const url = 'http://example.com/document';
    const builder = await factory.create(url, 'script');
    expect(builder).to.not.be.undefined;
  });

  it('should return undefined if no adapter is found', async () => {
    const url = 'http://example.com/document';
    const builder = await factory.create(url, 'unknown' as unknown as 'script');
    expect(builder).to.be.undefined;
  });

  it('should ensure fetchDocument was called with the correct URL', async () => {
    const url = 'http://example.com/document';
    await factory.create(url, 'script');
    expect(fetchDocumentStub.calledOnceWith(url)).to.be.true;
  });

  it('should validate the object returned by factory.create', async () => {
    const url = 'http://example.com/document';
    const builder = await factory.create(url, 'script');
    expect(builder).to.have.property('buildProject').that.is.a('function');
  });
});
