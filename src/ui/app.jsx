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
