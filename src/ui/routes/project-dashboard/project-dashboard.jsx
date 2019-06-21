import {h} from 'preact';
import {useProjectBuilds} from '../../hooks/use-api-data';

/** @param {{projectId: string}} props */
export const ProjectDashboard = props => {
  const [loadingState, builds] = useProjectBuilds(props.projectId);

  if (builds) {
    return <div>DATA {JSON.stringify(builds)}</div>;
  } else if (loadingState === 'error') {
    return <h1>Lighthouse Error</h1>;
  } else if (loadingState === 'loading') {
    return <h1>Loading...</h1>;
  }

  return null;
};
