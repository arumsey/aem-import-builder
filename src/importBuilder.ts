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
import {IGNORE_ELEMENTS} from './constants/index.js';

export type BuilderFileItem = {
  name: string;
  type?: 'parser';
  contents: string;
}

export type BuilderManifest = {
  files: BuilderFileItem[];
}

export type BuilderFunc = (...args: string[]) => Promise<BuilderManifest>;

export type AnyBuilder = {
  buildProject: BuilderFunc;
  addCleanup: BuilderFunc;
  buildBlocks: BuilderFunc;
};

export const isBuilderFileItem = (item: unknown): item is BuilderFileItem => {
  return !!item  && typeof item === 'object' && 'name' in item && 'contents' in item && 'type' in item;
}

const getDuration = (start: number) => {
  const end = Date.now();
  return (end - start) / 1000;
}

const ImportBuilder = (document: Document, adapter: ImportAdapter, rules?: ImportRules): AnyBuilder => {
  const importRules = ImportRulesBuilder(rules);
  const docBody = document.body.outerHTML;

  const buildRootRules = async () => {
    const start = Date.now();
    importEvents.emit('start', 'Assistant is analyzing the document to find the main content element');
    const assistant = ImportAssistant();
    const selector = await assistant.findMainContent(docBody);
    importEvents.emit('progress', `Using '${selector}' as the main content element (${getDuration(start)}s)`);
    importRules.setRoot(selector);
    importEvents.emit('complete');
  }

  const buildContentRemoval: BuilderFunc = async () => {
    importEvents.emit('start', 'Creating manifest for element removal');
    importRules.addCleanup(IGNORE_ELEMENTS);
    const content = await adapter.adaptContentRemoval();
    importEvents.emit('complete');
    return {files: content};
  }

  const buildBlocks: BuilderFunc = async () => {
    importEvents.emit('start', 'Analyzing document for blocks');
    const assistant = ImportAssistant();
    const blockRules = await assistant.findBlocks(docBody);
    blockRules.forEach(rule => importRules.addBlock(rule));
    importEvents.emit('progress', `Creating manifest for ${blockRules.length} blocks`);
    const content = await adapter.adaptBlockNames(blockRules.map(rule => rule.type));
    importEvents.emit('complete');
    return {files: content};
  }

  return {
    buildProject: async () => {
      importEvents.emit('start', 'Analyzing document for project creation');
      await buildRootRules();
      const { files: removalFiles } = await buildContentRemoval();
      const { files: blockFiles } = await buildBlocks();
      // add import rules file to manifest
      const rulesFileItem = await adapter.adaptImportRules(importRules.build());
      // perform final adaptation of manifest files
      const allFiles = [...removalFiles, ...blockFiles, ...rulesFileItem];
      const content = await adapter.adaptManifestFiles(allFiles);
      importEvents.emit('complete');
      return {files: [...content, { name: '/sourceDoc.html', contents: docBody }]};
    },
    addCleanup: async (namePrompt) => {
      if (!namePrompt) {
        return {files: []};
      }
      importEvents.emit('start', 'Assistant is analyzing the document to find elements to remove');
      const assistant = ImportAssistant();
      const selectors = await assistant.findRemovalSelectors(docBody, namePrompt);
      importRules.addCleanup(selectors);
      const rulesFileItem = await adapter.adaptImportRules(importRules.build());
      importEvents.emit('progress', `Added ${selectors.length} selectors to the cleanup rules`);
      importEvents.emit('complete');
      return {files: rulesFileItem};
    },
    buildBlocks
  }
};

export default ImportBuilder;
