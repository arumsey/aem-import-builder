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
import {DocumentEntry, DocumentManifest, fetchDocument} from './service/documentService.js';
import ImportBuilder, {AnyBuilder} from './importBuilder.js';
import {ImportAdapter} from './adapter/importAdapter.js';
import scriptImportAdapter from './adapter/scriptImportAdapter.js';
import {importEvents} from './events.js';
import {EventEmitter} from 'events';

type ImportBuilderCreateOptions = {
  mode?: 'script';
  rules?: ImportRules;
  documents?: DocumentManifest;
}

export type BuilderFactory = {
  create: (url: string, options?: ImportBuilderCreateOptions) => Promise<AnyBuilder | undefined>;
} & Pick<EventEmitter, 'on' | 'off'>

const ImportBuilderFactory: () => BuilderFactory = () => {
  return {
    on: importEvents.on.bind(importEvents),
    off: importEvents.off.bind(importEvents),
    create: async (url, {mode = 'script', rules, documents = new Set<DocumentEntry>()} = {}): Promise<AnyBuilder | undefined> => {
      const doc = await fetchDocument(url, {documents});
      let adapter: ImportAdapter | undefined;
      if (mode === 'script') {
        adapter = scriptImportAdapter;
      }
      if (adapter) {
        return ImportBuilder({document: doc, adapter, rules, documentManifest: documents});
      }
      return undefined;
    },
  }
};

export default ImportBuilderFactory;
