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
import ImportBuilderFactory from '../src/importBuilderFactory.js';
import { JSDOM } from 'jsdom';

chai.use(chaiAsPromised);

describe('ImportBuilderFactory', () => {
  let importEventsOnStub: sinon.SinonStub;
  let importEventsOffStub: sinon.SinonStub;
  let minifyPageStub: sinon.SinonStub;
  let factory: ReturnType<typeof ImportBuilderFactory>;

  const page: [string, string] = ['<html lang="en"><body>Test Document</body></html>', ''];

  beforeEach(async () => {
    importEventsOnStub = sinon.stub();
    importEventsOffStub = sinon.stub();

    const dom = new JSDOM(page[0]);
    minifyPageStub = sinon.stub().resolves([dom.window.document]);

    const ImportBuilderFactoryMock = await esmock('../src/importBuilderFactory.js', {
      '../src/events.js': {
        importEvents: {
          on: importEventsOnStub,
          off: importEventsOffStub,
        },
      },
      '../src/utils/pageUtils.js': {
        minifyPage: minifyPageStub,
      },
    });

    factory = ImportBuilderFactoryMock();

  });

  afterEach(() => {
    sinon.restore();
  });

  it('should create an ImportBuilder with script mode', async () => {
    const builder = await factory.create({ mode: 'script', page });
    expect(builder).to.not.be.undefined;
  });

  it('should throw an error when no page content is provided', async () => {
    minifyPageStub.resolves([]);
    await expect(factory.create({ mode: 'script' })).to.be.rejectedWith(Error, 'No page content provided.');
  });

  it('should return undefined if no adapter is found', async () => {
    const builder = await factory.create({ mode: 'unknown' as unknown as 'script', page });
    expect(builder).to.be.undefined;
  });

  it('should validate the object returned by factory.create', async () => {
    const builder = await factory.create({ mode:'script', page });
    expect(builder).to.have.property('buildProject').that.is.a('function');
  });

  it('should call minifyPage when creating an ImportBuilder', async () => {
    await factory.create({ mode: 'script', page });
    expect(minifyPageStub.calledOnce).to.be.true;
  });
});
