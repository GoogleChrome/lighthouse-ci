/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
export {LoadingSpinner} from '../../../../server/src/ui/components/loading-spinner.jsx';
export {Paper} from '../../../../server/src/ui/components/paper.jsx';
export {LhrViewerButton} from '../../../../server/src/ui/components/lhr-viewer-button.jsx';

/** @type {string} */
// @ts-expect-error - tsc doesn't get parcel :)
export const CONFETTI_PATH = require('../../../../server/src/ui/routes/project-list/confetti.svg');

/** @type {string} */
// @ts-expect-error - tsc doesn't get parcel :)
export const LH_LOGO_PATH = require('../../../../server/src/ui/logo.svg');
