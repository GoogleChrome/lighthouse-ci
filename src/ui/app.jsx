/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useEffect} from 'preact/hooks';
import Router, {route} from 'preact-router';
import LazyRoute from 'preact-async-route';

const Loader = () => <h1>Loading route...</h1>;

/** @param {{to: string, default?: boolean}} props */
const Redirect = props => {
  useEffect(() => {
    route(props.to);
  }, []);

  return <div {...props} />;
};

export const App = () => {
  return (
    <Router>
      <LazyRoute
        path="/app/projects"
        loading={() => <Loader />}
        getComponent={() =>
          import('./routes/project-list/project-list.jsx').then(m => m.ProjectList)
        }
      />
      <LazyRoute
        path="/app/projects/:projectId"
        loading={() => <Loader />}
        getComponent={() =>
          import('./routes/project-dashboard/project-dashboard.jsx').then(m => m.ProjectDashboard)
        }
      />
      <Redirect default to="/app/projects" />
    </Router>
  );
};
