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
import TemplateBuilder from '../templateBuilder.js';
import {ImportAdapter} from './importAdapter.js';
import {importEvents} from '../events.js';
import {BuilderFileItem, isBuilderFileItem} from '../importBuilder.js';
import {stringifyObject} from '../utils/stringUtils.js';

type TEMPLATE_KEYS = 'import' | 'rules' | 'remove' | 'block' | 'metadata';
const SCRIPT_TEMPLATE: Record<TEMPLATE_KEYS | string, string> = Object.freeze({
  import: 'import-script-template.hbs',
  rules: 'import-rules-template.hbs',
  remove: 'import-removal-template.hbs',
  metadata: '/templates/metadata-template.hbs',
  block: '/templates/block-template.hbs',
});

const defaultBlockData = { configs: stringifyObject({}), cells: stringifyObject([['']])};

/*
const extractBlockName = (path: string) => {
  const match = path.match(/.*\/(.+)\.js/);
  return match ? match[1] : null;
};
*/

const scriptImportAdapter: ImportAdapter = {
  adaptContentRemoval: async () => {
    importEvents.emit('progress', 'Generating removal script');
    const script = await TemplateBuilder.merge(SCRIPT_TEMPLATE.remove, {}, { variant: 'gist'});
    importEvents.emit('progress', 'Removal script created');
    return [{ name: '/removal-script.js', contents: script }];
  },
  adaptBlockNames: async (blocks = []) => {
    // merge block names into their appropriate template
    importEvents.emit('progress', 'Generating block scripts');
    const manifest = await Promise.all(blocks.map(async (block) => {
      const { [block]: template = SCRIPT_TEMPLATE.block } = SCRIPT_TEMPLATE;
      if (template) {
        const script = await TemplateBuilder.merge(template, {...defaultBlockData, name: block});
        return { name: `/parsers/${block}.js`, contents: script, type: 'parser' } as BuilderFileItem;
      }
      return null;
    }));
    const filteredManifest = manifest.filter(isBuilderFileItem);
    importEvents.emit('progress', `${filteredManifest.length} block scripts created`);
    return filteredManifest;
  },
  adaptCellParser: async (block: string, script: string) => {
    return [{
      name: `/parsers/${block}.js`,
      contents: script,
      type: 'parser',
    }];
  },
  adaptRules: async (rules) => {
    importEvents.emit('progress', 'Generating import rules script');
    const script = await TemplateBuilder.merge(SCRIPT_TEMPLATE.rules, { rules: stringifyObject(rules)}, { variant: 'gist'});
    importEvents.emit('progress', 'Import rules created');
    return [{ name: '/import-rules.js', contents: script }];
  },
  adaptBlockRules: async (rules) => {
    importEvents.emit('progress', 'Customizing import script');
    const templateData = {parsers: rules.map((item) => ({ block: item.type, path: `./parsers/${item.type}.js` }))};
    const script = await TemplateBuilder.merge(SCRIPT_TEMPLATE.import, templateData, { variant: 'gist'});
    importEvents.emit('progress', 'Import script created');
    return [{ name: '/import.js', contents: script }];
  },
}

export default scriptImportAdapter;
