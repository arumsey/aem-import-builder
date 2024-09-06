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

import {importEvents} from '../events.js';
import {IGNORE_ELEMENTS} from '../constants/index.js';
import ImportAssistant from '../importAssistant.js';
import {
  AdapterBuilderArgs,
  AsyncBuilderFunc,
  BuilderFileItem,
  BuilderFunc
} from '../importBuilder.js';
import {DocumentManifest} from '../service/documentService.js';
import ImportRuleBuilder from 'aem-import-rules/dist/rulebuilder.js';

type RuleBuilder = ReturnType<typeof ImportRuleBuilder>;

export const buildDocumentManifest: BuilderFunc<[DocumentManifest]> = (documentManifest) => {
  return { files: [{ name: '/documentSet.json', contents: JSON.stringify(Array.from(documentManifest)) }]}
}

export const buildContentRemoval: AsyncBuilderFunc<AdapterBuilderArgs<[RuleBuilder]>> = async (adapter, importRules) => {
  importEvents.emit('start', 'Creating manifest for element removal');
  importRules.addCleanup(IGNORE_ELEMENTS);
  const content = await adapter.adaptContentRemoval();
  importEvents.emit('complete');
  return {files: content};
}

export const buildBlocks: AsyncBuilderFunc<AdapterBuilderArgs<[RuleBuilder, string]>> = async (adapter, importRules, docBody) => {
  importEvents.emit('start', 'Analyzing document for blocks');
  const assistant = ImportAssistant();
  const blockRules = await assistant.findBlocks(docBody);
  blockRules.forEach(rule => importRules.addBlock(rule));
  importEvents.emit('progress', `Creating manifest for ${blockRules.length} blocks`);
  const content = await adapter.adaptBlockNames(blockRules.map(rule => rule.type));
  importEvents.emit('complete');
  return {files: content};
}

export const buildImportRules: AsyncBuilderFunc<AdapterBuilderArgs<[RuleBuilder]>> = async (adapter, importRules) => {
  const content = await adapter.adaptRules(importRules.build());
  return {files: content};
}

export const buildImporter: AsyncBuilderFunc<AdapterBuilderArgs<[BuilderFileItem[]]>> = async (adapter, files) => {
  const content = await adapter.adaptFileItems(files);
  return {files: content};
}
