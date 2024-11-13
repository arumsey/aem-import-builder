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

import { ImportRulesBuilder, ImportRules, BlockRule } from 'aem-import-rules';
import ImportAssistant from './importAssistant.js';
import { ImportAdapter } from './adapter/importAdapter.js';
import { importEvents } from './events.js';
import {
  buildContentRemoval,
  buildBlocks,
  buildImportRules,
  buildImporter,
  buildCellParser,
  buildPageTransformer,
} from './builder/index.js';
import { IGNORE_ELEMENTS } from './constants/index.js';
import { PageCollection } from './utils/pageUtils.js';

export type BuilderFileItem = {
  name: string;
  type?: 'parser' | 'transformer';
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
  addBlock: AsyncBuilderFunc<string[]>;
  addCellParser: AsyncBuilderFunc<string[]>;
  addPageTransformer: AsyncBuilderFunc<string[]>;
};

type ImportBuilderOptions = {
  content: PageCollection<Document>;
  adapter: ImportAdapter;
  rules?: ImportRules;
};

const metadataBlockRule: BlockRule = {
  type: 'metadata',
  insertMode: 'append',
};

export const isBuilderFileItem = (item: unknown): item is BuilderFileItem => {
  return !!item  && typeof item === 'object' && 'name' in item && 'contents' in item && 'type' in item;
}

const getDuration = (start: number) => {
  const end = Date.now();
  return (end - start) / 1000;
}

const ImportBuilder = ({ content, adapter, rules }: ImportBuilderOptions): AnyBuilder => {
  const importRules = ImportRulesBuilder(rules);
  const [dom, screenshot] = content;
  const docBody = dom.body.outerHTML;

  const addRootRule = async () => {
    const start = Date.now();
    importEvents.emit('start', 'Assistant is analyzing the document to find the main content element');
    const assistant = ImportAssistant(docBody, screenshot);
    const selector = await assistant.findMainContent();
    importEvents.emit('progress', `Using '${selector}' as the main content element (${getDuration(start)}s)`);
    importRules.setRoot(selector);
    importEvents.emit('complete');
  }

  return {
    buildProject: async () => {
      // update import rules
      await addRootRule();
      importRules.addCleanup(IGNORE_ELEMENTS);
      importRules.addBlock(metadataBlockRule);
      // build all the files
      importEvents.emit('start', 'Creating project files');
      const { files: removalFiles } = await buildContentRemoval(adapter);
      const { files: blockFiles } = await buildBlocks(adapter, [metadataBlockRule]);
      const { files: rulesFileItem } = await buildImportRules(adapter, importRules);
      const allFiles = [...removalFiles, ...blockFiles, ...rulesFileItem];
      const { files: importerFiles } = await buildImporter(adapter, importRules);
      importEvents.emit('complete');
      return { files: [...allFiles, ...importerFiles] };
    },
    addCleanup: async (namePrompt) => {
      if (!namePrompt) {
        return { files: [] };
      }
      const start = Date.now();
      importEvents.emit('start', 'Assistant is analyzing the document to find elements to remove');
      // update import rules
      const assistant = ImportAssistant(docBody, screenshot);
      const selectors = await assistant.findRemovalSelectors(namePrompt);
      importRules.addCleanup(selectors);
      importEvents.emit('progress', `Added ${selectors.length} selectors to the cleanup rules in (${getDuration(start)}s)`);
      importEvents.emit('complete');
      // get all the files that need to be updated
      importEvents.emit('start', 'Creating import files');
      const { files: rulesFileItem } = await buildImportRules(adapter, importRules);
      importEvents.emit('complete');
      return { files: [...rulesFileItem] };
    },
    addBlock: async (name, prompt) => {
      if (!name || !prompt) {
        return { files: [] };
      }
      const start = Date.now();
      importEvents.emit('start', 'Assistant is analyzing the document to find the requested block');
      const assistant = ImportAssistant(docBody, screenshot);
      const partialRules = await assistant.findBlockSelectors(prompt);
      // update import rules
      const blockRules = partialRules.map<BlockRule>((rule) => ({ ...rule, type: name }));
      blockRules.forEach((rule) => importRules.addBlock(rule));
      importEvents.emit('progress', `Added ${partialRules.length} blocks to the block rules in (${getDuration(start)}s)`);
      importEvents.emit('complete');
      // get all the files that need to be updated
      importEvents.emit('start', 'Creating import files');
      const { files: blockFiles } = await buildBlocks(adapter, blockRules);
      const { files: rulesFileItem } = await buildImportRules(adapter, importRules);
      const allFiles = [...blockFiles, ...rulesFileItem];
      const { files: importerFiles } = await buildImporter(adapter, importRules);
      importEvents.emit('complete');
      return { files: [...allFiles, ...importerFiles] };
    },
    addCellParser: async (name, prompt) => {
      const blockRule = importRules.findBlock(name);
      if (!blockRule || !prompt) {
        return { files: [] };
      }
      const start = Date.now();
      importEvents.emit('start', `Assistant is analyzing the document to find the cells for the ${name} block`);
      const { selectors = [] } = blockRule;
      const assistant = ImportAssistant(docBody, screenshot);
      const [parser] = await assistant.findBlockCells(selectors, prompt);
      importEvents.emit('progress', `Added parser script for ${name} block in (${getDuration(start)}s)`);
      importEvents.emit('complete');
      // update parser files
      importEvents.emit('start', 'Creating import files');
      const { files: parserFileItem } = await buildCellParser(adapter, blockRule, parser);
      importEvents.emit('complete');
      return { files: [...parserFileItem] };
    },
    addPageTransformer: async (name, prompt) => {
      if (!name || !prompt) {
        return { files: [] };
      }
      importRules.addTransformer({ name });
      const transformRule = importRules.findTransformer(name);
      if (!transformRule) {
        return { files: [] };
      }
      const start = Date.now();
      importEvents.emit('start', `Assistant is analyzing the document to generate a ${name} transformation function`);
      const assistant = ImportAssistant(docBody, screenshot);
      const [transformScript] = await assistant.generatePageTransformation(prompt);
      importEvents.emit('progress', `Added transformer script in (${getDuration(start)}s)`);
      importEvents.emit('complete');
      // get all the files that need to be updated
      importEvents.emit('start', 'Creating import files');
      const { files: transformFiles } = await buildPageTransformer(adapter, transformRule, transformScript);
      const { files: rulesFileItem } = await buildImportRules(adapter, importRules);
      const allFiles = [...transformFiles, ...rulesFileItem];
      const { files: importerFiles } = await buildImporter(adapter, importRules);
      importEvents.emit('complete');
      return { files: [...allFiles, ...importerFiles] };
    },
  }
};

export default ImportBuilder;
