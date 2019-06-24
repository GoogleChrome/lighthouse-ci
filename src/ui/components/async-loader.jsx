import {h} from 'preact';
import {LoadingState} from '../hooks/use-api-data';

/**
 * @template T
 * @param {{loadingState: LoadingState, asyncData: T | undefined, render: (data: T) => JSX.Element}} props */
export const AsyncLoader = props => {
  const {asyncData, loadingState, render} = props;

  if (loadingState === 'loaded' && asyncData) {
    return render(asyncData);
  } else if (loadingState === 'error') {
    return <h1>Lighthouse Error</h1>;
  } else if (loadingState === 'loading') {
    return <h1>Loading...</h1>;
  }

  return null;
};
