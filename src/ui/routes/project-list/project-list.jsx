import {h} from 'preact';
import {useProjectList} from '../../hooks/use-api-data';

export const ProjectList = () => {
  const [loadingState, projects] = useProjectList();

  if (projects) {
    return <div>DATA {JSON.stringify(projects)}</div>;
  } else if (loadingState === 'error') {
    return <h1>Lighthouse Error</h1>;
  } else if (loadingState === 'loading') {
    return <h1>Loading...</h1>;
  }

  return null;
};
