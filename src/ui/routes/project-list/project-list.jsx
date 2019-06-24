import {h} from 'preact';
import {useProjectList} from '../../hooks/use-api-data';
import {AsyncLoader} from '../../components/async-loader';

export const ProjectList = () => {
  const [loadingState, projects] = useProjectList();

  return (
    <AsyncLoader
      loadingState={loadingState}
      asyncData={projects}
      render={projects => <pre>{JSON.stringify(projects, null, 2)}</pre>}
    />
  );
};
