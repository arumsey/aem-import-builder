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

import {
  AdapterBuilderArgs,
  AsyncBuilderFunc,
  BuilderFunc,
} from '../importBuilder.js';
import {DocumentManifest} from '../service/documentService.js';
import ImportRuleBuilder from 'aem-import-rules/dist/rulebuilder.js';
import {BlockRule} from 'aem-import-rules';

type RuleBuilder = ReturnType<typeof ImportRuleBuilder>;

export const buildDocumentManifest: BuilderFunc<[DocumentManifest]> = (documentManifest) => {
  return { files: [{ name: '/documentSet.json', contents: JSON.stringify(Array.from(documentManifest)) }]}
}

export const buildContentRemoval: AsyncBuilderFunc = async (adapter) => {
  const content = await adapter.adaptContentRemoval();
  return {files: content};
}

export const buildBlocks: AsyncBuilderFunc<AdapterBuilderArgs<[BlockRule[]]>> = async (adapter, blockRules) => {
  const content = await adapter.adaptBlockNames(blockRules.map(rule => rule.type));
  return {files: content};
}

export const buildCellParser: AsyncBuilderFunc<AdapterBuilderArgs<[BlockRule, string]>> = async (adapter, blockRule, script) => {
  const content = await adapter.adaptCellParser(blockRule.type, script);
  return {files: content};
}

export const buildImportRules: AsyncBuilderFunc<AdapterBuilderArgs<[RuleBuilder]>> = async (adapter, importRules) => {
  const content = await adapter.adaptRules(importRules.build());
  return {files: content};
}

export const buildImporter: AsyncBuilderFunc<AdapterBuilderArgs<[BlockRule[]]>> = async (adapter, rules) => {
  const content = await adapter.adaptBlockRules(rules);
  return {files: content};
}
