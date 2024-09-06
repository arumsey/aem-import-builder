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

const DEFAULT_ATTRIBUTES = ['class', 'name', 'id', 'property', 'content'];

function removeEmptyElements(document: Document) {
  // Select all elements in the document
  const elements = document.querySelectorAll('*');
  // Iterate over all elements and remove the empty ones
  elements.forEach((element) => {
    // Check if the element has no child nodes or contains only whitespace
    if (!element.hasChildNodes() || element.textContent?.trim() === '') {
      element.remove();
    }
  });
}

function removeElements(document: Document, names: string[] = []) {
  names.forEach((tag) => document.querySelectorAll(tag).forEach(el => el.remove()));
}

function removeAttributes(document: Document, keep = DEFAULT_ATTRIBUTES) {
  function processElement(element: Element | null) {
    if (!element) {
      return;
    }
    // If the element has attributes, remove them except for keep
    if (element.attributes) {
      const attributesToKeepSet = new Set(keep);
      // Remove all attributes (except for keep set)
      Array.from(element.attributes)
        .filter((attr) => !attributesToKeepSet.has(attr.name))
        .forEach((attr) => element.removeAttribute(attr.name));
    }

    // Recursively process each child element
    Array.from(element.children).forEach(child => {
      processElement(child);
    });
  }

  // Start processing from the document's body or another element if needed
  processElement(document.firstElementChild);
}

export const DocumentUtils = (document: Document) => {
  const docUtils = {
    removeEmptyElements: () => {
      removeEmptyElements(document);
      return docUtils;
    },
    removeElements: (names: string[]) => {
      removeElements(document, names);
      return docUtils;
    },
    removeAttributes: (keep?: string[]) => {
      removeAttributes(document, keep);
      return docUtils;
    }
  };
  return docUtils;
}
