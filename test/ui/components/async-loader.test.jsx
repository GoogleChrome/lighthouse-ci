import {h} from 'preact';
import {AsyncLoader} from '../../../src/ui/components/async-loader.jsx';
import {render, cleanup} from '../test-utils.jsx';

afterEach(cleanup);

describe('AsyncLoader', () => {
  it('should render the loading state', async () => {
    const {container} = render(<AsyncLoader loadingState="loading" />);
    expect(container.innerHTML).toMatchInlineSnapshot(`"<h1>Loading...</h1>"`);
  });

  it('should render the error state', async () => {
    const {container} = render(<AsyncLoader loadingState="error" />);
    expect(container.innerHTML).toMatchInlineSnapshot(`"<h1>Lighthouse Error</h1>"`);
  });

  it('should render the loaded state', async () => {
    const {container} = render(
      <AsyncLoader
        loadingState="loaded"
        asyncData={{x: 1}}
        render={data => <span>{JSON.stringify(data)}</span>}
      />
    );

    expect(container.innerHTML).toMatchInlineSnapshot(`"<span>{\\"x\\":1}</span>"`);
  });
});
