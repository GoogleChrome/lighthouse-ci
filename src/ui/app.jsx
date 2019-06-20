import {h} from 'preact';
import {useState, useEffect} from 'preact/hooks';

/** @typedef {'loading'|'error'|'connected'} LoadingState */

/** @type {Record<LoadingState, string>} */
const messagesForLoadingState = {
  loading: 'is trying to connect...',
  error: 'has failed to connect.',
  connected: 'is connected!',
};

export const App = () => {
  const [loadingState, setLoadingState] = useState(/** @type {LoadingState} */ ('loading'));

  useEffect(
    () => {
      // Wrap in IIFE because the return value of useEffect should be a cleanup function, not a Promise.
      (async () => {
        try {
          const response = await fetch('/v1/projects');
          if (response.status !== 200) throw new Error('Could not connect.');
          setLoadingState('connected');
        } catch (err) {
          setLoadingState('error');
        }
      })();
    },
    /* no state dependencies, only run this connection check on initial mount */ []
  );

  return <h1>Lighthouse CI {messagesForLoadingState[loadingState]}</h1>;
};
