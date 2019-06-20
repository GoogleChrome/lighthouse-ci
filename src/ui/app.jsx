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

  useEffect(async () => {
    try {
      const response = await fetch('/v1/projects');
      if (response.status !== 200) throw new Error('Could not connect.');
      setLoadingState('connected');
    } catch (err) {
      setLoadingState('error');
    }
  }, []);

  return <h1>Lighthouse CI {messagesForLoadingState[loadingState]}</h1>;
};
