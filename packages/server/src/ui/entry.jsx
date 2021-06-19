/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, render} from 'preact';
import {App} from './app.jsx';

// Fontsource for fonts/icons instead of google cdn
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/material-icons";

const preactRoot = document.getElementById('preact-root');
if (!preactRoot) throw new Error('Missing #preact-root');
render(<App />, preactRoot);
