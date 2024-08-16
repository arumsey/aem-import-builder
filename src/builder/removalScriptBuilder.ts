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
import {Builder} from '../importBuilder.js';
import ImportAssistant from '../importAssistant.js';
import TemplateBuilder from '../templateBuilder.js';
import ora from 'ora';

const SCRIPT_TEMPLATE = '/templates/removal-template.hbs';

const removalScriptBuilder: Builder['buildContentRemoval'] = async (content: string) => {
  const spinner = ora({
    text: 'Analyzing document for elements to remove',
    color: 'yellow',
    indent: 2
  }).start();
  const assistant = ImportAssistant();
  const selectors = await assistant.findRemovalSelectors(content);
  spinner.text = 'Generating removal script';
  // merge selectors into the removal script template
  const script = await TemplateBuilder.merge(SCRIPT_TEMPLATE, {selectors: JSON.stringify(selectors)});
  spinner.succeed(`Removal script with ${selectors.length} selectors created`);
  return script;
}

export default removalScriptBuilder;
