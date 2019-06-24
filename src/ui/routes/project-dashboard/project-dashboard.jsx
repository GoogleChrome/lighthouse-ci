import {h} from 'preact';
import {useProjectBuilds} from '../../hooks/use-api-data';
import {AsyncLoader} from '../../components/async-loader';

/** @param {{projectId: string}} props */
export const ProjectDashboard = props => {
  const [loadingState, builds] = useProjectBuilds(props.projectId);

  return (
    <AsyncLoader
      loadingState={loadingState}
      asyncData={builds}
      render={builds => <pre>{JSON.stringify(builds, null, 2)}</pre>}
    />
  );
};
