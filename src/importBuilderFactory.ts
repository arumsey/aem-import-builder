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

import {ImportRules} from 'aem-import-rules';
import {minifyPage, PageOptions} from './utils/pageUtils.js';
import ImportBuilder, {AnyBuilder} from './importBuilder.js';
import {ImportAdapter} from './adapter/importAdapter.js';
import scriptImportAdapter from './adapter/scriptImportAdapter.js';
import {importEvents} from './events.js';
import {EventEmitter} from 'events';
import {builderConfig} from './config.js';

export type ServiceOptions = {
  apiKey: string;
  environment: 'dev' | 'prod';
};

export type FactoryOptions = {
  baseUrl?: string;
} & ServiceOptions;

type ImportBuilderCreateOptions = {
  mode?: 'script';
  rules?: ImportRules;
} & PageOptions;

export type BuilderFactory = {
  create: (options?: ImportBuilderCreateOptions) => Promise<AnyBuilder | undefined>;
} & Pick<EventEmitter, 'on' | 'off'>

const ImportBuilderFactory: (options?: FactoryOptions) => BuilderFactory = (options) => {

  builderConfig.mergeConfig(options);

  return {
    on: importEvents.on.bind(importEvents),
    off: importEvents.off.bind(importEvents),
    create: async ({mode = 'script', rules, page} = {}): Promise<AnyBuilder | undefined> => {
      const content = await minifyPage({page});
      if (content.length === 0) {
        throw new Error('No page content provided.');
      }
      let adapter: ImportAdapter | undefined;
      if (mode === 'script') {
        adapter = scriptImportAdapter;
      }
      if (adapter) {
        return ImportBuilder({content, adapter, rules});
      }
      return undefined;
    },
  }
};

export default ImportBuilderFactory;
