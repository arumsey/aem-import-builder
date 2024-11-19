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

import findMainContent from './assistant/findMainContent.js';
import findRemovalSelectors from './assistant/findRemovalSelectors.js';
import findBlockSelectors from './assistant/findBlocks.js';
import findBlockCells from './assistant/findCells.js';
import generatePageTransformation from './assistant/generatePageTransformation.js';

const ImportAssistant = (document: string, screenshot: string) => {
  const escapedDocument = document.replace(/"/g, '\\"');
  return {
    findMainContent: () => findMainContent(escapedDocument),
    findRemovalSelectors: (pattern: string) => findRemovalSelectors(escapedDocument, pattern),
    findBlockSelectors: (pattern: string) => findBlockSelectors(escapedDocument, screenshot, pattern),
    findBlockCells: (selectors: string[], pattern: string) => findBlockCells(escapedDocument, screenshot, selectors, pattern),
    generatePageTransformation: (pattern: string) => generatePageTransformation(escapedDocument, pattern),
  }
};

export default ImportAssistant;
