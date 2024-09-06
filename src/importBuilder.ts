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

import {ImportRulesBuilder, ImportRules} from 'aem-import-rules';
import ImportAssistant from './importAssistant.js';
import {ImportAdapter} from './adapter/importAdapter.js';
import {importEvents} from './events.js';
import {DocumentManifest} from './service/documentService.js';
import {
  buildContentRemoval,
  buildBlocks,
  buildImportRules,
  buildDocumentManifest,
  buildImporter
} from './builder/index.js';

export type BuilderFileItem = {
  name: string;
  type?: 'parser';
  contents: string;
}

export type BuilderManifest = {
  files: BuilderFileItem[];
}

/**
 * All builder functions must return a BuilderManifest. The arguments to each builder function,
 * however can be unique to the builder function.
 *
 * Most builder functions will require an ImportAdapter. The AdapterBuilderArgs type
 * ensures the first argument is always an ImportAdapter.
 */
export type AdapterBuilderArgs<T extends Array<unknown> = []> = [ImportAdapter, ...T];
export type BuilderFunc<Args extends Array<unknown> = AdapterBuilderArgs> = (...args: Args) => BuilderManifest;
export type AsyncBuilderFunc<Args extends Array<unknown> = AdapterBuilderArgs> = (...args: Args) => Promise<BuilderManifest>;

export type AnyBuilder = {
  buildProject: AsyncBuilderFunc<string[]>;
  addCleanup: AsyncBuilderFunc<string[]>;
};

type ImportBuilderOptions = {
  document: Document;
  adapter: ImportAdapter;
  rules?: ImportRules;
  documentManifest: DocumentManifest;
}

export const isBuilderFileItem = (item: unknown): item is BuilderFileItem => {
  return !!item  && typeof item === 'object' && 'name' in item && 'contents' in item && 'type' in item;
}

const getDuration = (start: number) => {
  const end = Date.now();
  return (end - start) / 1000;
}

const ImportBuilder = ({document, adapter, rules, documentManifest }: ImportBuilderOptions): AnyBuilder => {
  const importRules = ImportRulesBuilder(rules);
  const docBody = document.body.outerHTML;

  const addRootRule = async () => {
    const start = Date.now();
    importEvents.emit('start', 'Assistant is analyzing the document to find the main content element');
    const assistant = ImportAssistant();
    const selector = await assistant.findMainContent(docBody);
    importEvents.emit('progress', `Using '${selector}' as the main content element (${getDuration(start)}s)`);
    importRules.setRoot(selector);
    importEvents.emit('complete');
  }

  return {
    buildProject: async () => {
      importEvents.emit('start', 'Analyzing document for project creation');
      // update import rules
      await addRootRule();
      // build all the files
      const { files: removalFiles } = await buildContentRemoval(adapter, importRules);
      const { files: blockFiles } = await buildBlocks(adapter, importRules, docBody);
      const { files: rulesFileItem } = await buildImportRules(adapter, importRules);
      const { files: documentFileItem } = buildDocumentManifest(documentManifest);
      const allFiles = [...removalFiles, ...blockFiles, ...rulesFileItem, ...documentFileItem];
      const { files: importerFiles } = await buildImporter(adapter, allFiles);
      importEvents.emit('complete');
      return {files: [...allFiles, ...importerFiles]};
    },
    addCleanup: async (namePrompt) => {
      if (!namePrompt) {
        return {files: []};
      }
      importEvents.emit('start', 'Assistant is analyzing the document to find elements to remove');
      // update import rules
      const assistant = ImportAssistant();
      const selectors = await assistant.findRemovalSelectors(docBody, namePrompt);
      importRules.addCleanup(selectors);
      // get all the files that need to be updated
      const { files: rulesFileItem } = await buildImportRules(adapter, importRules);
      const { files: documentFileItem } = buildDocumentManifest(documentManifest);
      importEvents.emit('progress', `Added ${selectors.length} selectors to the cleanup rules`);
      importEvents.emit('complete');
      return {files: [...rulesFileItem, ...documentFileItem]};
    }
  }
};

export default ImportBuilder;
