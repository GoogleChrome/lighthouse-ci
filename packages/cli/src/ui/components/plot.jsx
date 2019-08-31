// The MIT License (MIT)

// Copyright (c) 2017 Plotly, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// The following is an adaptation of https://github.com/plotly/react-plotly.js

import {h, Component} from 'preact';
import {Plotly} from './plotly.js';

// The naming convention is:
//   - events are attached as `'plotly_' + eventName.toLowerCase()`
//   - react props are `'on' + eventName`
const eventNames = [
  'AfterExport',
  'AfterPlot',
  'Animated',
  'AnimatingFrame',
  'AnimationInterrupted',
  'AutoSize',
  'BeforeExport',
  'ButtonClicked',
  'Click',
  'ClickAnnotation',
  'Deselect',
  'DoubleClick',
  'Framework',
  'Hover',
  'LegendClick',
  'LegendDoubleClick',
  'Relayout',
  'Restyle',
  'Redraw',
  'Selected',
  'Selecting',
  'SliderChange',
  'SliderEnd',
  'SliderStart',
  'Transitioning',
  'TransitionInterrupted',
  'Unhover',
];

const updateEvents = [
  'plotly_restyle',
  'plotly_redraw',
  'plotly_relayout',
  'plotly_doubleclick',
  'plotly_animated',
];

/**
 * @typedef PlotProps
 * @prop {Array<import('plotly.js').Data>} data
 * @prop {Partial<import('plotly.js').Layout>} layout
 * @prop {Partial<import('plotly.js').Config>} [config]
 * @prop {Array<import('plotly.js').Frame>} [frames]
 * @prop {string} [divId]
 * @prop {any} [style]
 * @prop {string} [className]
 * @prop {number} [revision]
 * @prop {boolean} [debug]
 * @prop {boolean} [debug]
 * @prop {boolean} [useResizeHandler]
 * @prop {(...args: any[]) => any} [onUpdate]
 * @prop {(...args: any[]) => any} [onUpdate]
 * @prop {(...args: any[]) => any} [onPurge]
 * @prop {(...args: any[]) => any} [onError]
 * @prop {(...args: any[]) => any} [onInitialized]
 */

/** @extends {Component<PlotProps>} */
export class Plot extends Component {
  /** @param {PlotProps} props */
  constructor(props) {
    super(props);

    // @ts-ignore - using untyped plot.ly implementation
    this.p = Promise.resolve();
    this.resizeHandler = null;
    /** @type {any} */
    this.handlers = {};

    this.syncWindowResize = this.syncWindowResize.bind(this);
    this.syncEventHandlers = this.syncEventHandlers.bind(this);
    this.attachUpdateEvents = this.attachUpdateEvents.bind(this);
    this.getRef = this.getRef.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.figureCallback = this.figureCallback.bind(this);
    this.updatePlotly = this.updatePlotly.bind(this);
  }

  // @ts-ignore - using untyped plot.ly implementation
  updatePlotly(shouldInvokeResizeHandler, figureCallbackFunction, shouldAttachUpdateEvents) {
    this.p = this.p
      .then(() => {
        if (!this.el) {
          let error;
          if (this.unmounting) {
            error = new Error('Component is unmounting');
          } else {
            error = new Error('Missing element reference');
          }
          throw error;
        }
        return Plotly.react(this.el, this.props.data, this.props.layout, {
          ...this.props.config,
          displayModeBar: false,
        });
      })
      .then(() => this.syncWindowResize(shouldInvokeResizeHandler))
      .then(this.syncEventHandlers)
      .then(() => this.figureCallback(figureCallbackFunction))
      .then(shouldAttachUpdateEvents ? this.attachUpdateEvents : () => {})
      .catch(
        /** @param {Error} err */ err => {
          if (err.message.includes('unmounting')) {
            return;
          }
          console.error('Error while plotting:', err); // eslint-disable-line no-console
          if (this.props.onError) {
            this.props.onError(err);
          }
        }
      );
  }

  componentDidMount() {
    this.unmounting = false;

    this.updatePlotly(true, this.props.onInitialized, true);
  }

  /** @param {PlotProps} prevProps */
  componentDidUpdate(prevProps) {
    this.unmounting = false;

    // frames *always* changes identity so fall back to check length only :(
    const numPrevFrames = prevProps.frames && prevProps.frames.length ? prevProps.frames.length : 0;
    const numNextFrames =
      this.props.frames && this.props.frames.length ? this.props.frames.length : 0;

    const figureChanged = !(
      prevProps.layout === this.props.layout &&
      prevProps.data === this.props.data &&
      prevProps.config === this.props.config &&
      numNextFrames === numPrevFrames
    );
    const revisionDefined = prevProps.revision !== void 0;
    const revisionChanged = prevProps.revision !== this.props.revision;

    if (!figureChanged && (!revisionDefined || (revisionDefined && !revisionChanged))) {
      return;
    }

    this.updatePlotly(false, this.props.onUpdate, false);
  }

  componentWillUnmount() {
    this.unmounting = true;

    this.figureCallback(this.props.onPurge);

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    this.removeUpdateEvents();

    Plotly.purge(this.el);
  }

  attachUpdateEvents() {
    if (!this.el || !this.el.removeListener) {
      return;
    }

    updateEvents.forEach(updateEvent => {
      this.el.on(updateEvent, this.handleUpdate);
    });
  }

  removeUpdateEvents() {
    if (!this.el || !this.el.removeListener) {
      return;
    }

    updateEvents.forEach(updateEvent => {
      this.el.removeListener(updateEvent, this.handleUpdate);
    });
  }

  handleUpdate() {
    this.figureCallback(this.props.onUpdate);
  }

  // @ts-ignore - using untyped plot.ly implementation
  figureCallback(callback) {
    if (typeof callback === 'function') {
      const {data, layout} = this.el;
      const frames = this.el._transitionData ? this.el._transitionData._frames : null;
      const figure = {data, layout, frames};
      callback(figure, this.el);
    }
  }

  // @ts-ignore - using untyped plot.ly implementation
  syncWindowResize(invoke) {
    if (this.props.useResizeHandler && !this.resizeHandler) {
      this.resizeHandler = () => Plotly.Plots.resize(this.el);
      window.addEventListener('resize', this.resizeHandler);
      if (invoke) {
        this.resizeHandler();
      }
    } else if (!this.props.useResizeHandler && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  // @ts-ignore - using untyped plot.ly implementation
  getRef(el) {
    this.el = el;

    if (this.props.debug) {
      // @ts-ignore - using untyped plot.ly implementation
      window.gd = this.el;
    }
  }

  // Attach and remove event handlers as they're added or removed from props:
  syncEventHandlers() {
    eventNames.forEach(eventName => {
      // @ts-ignore - using untyped plot.ly implementation
      const prop = this.props['on' + eventName];
      const hasHandler = Boolean(this.handlers[eventName]);

      if (prop && !hasHandler) {
        this.handlers[eventName] = prop;
        this.el.on('plotly_' + eventName.toLowerCase(), this.handlers[eventName]);
      } else if (!prop && hasHandler) {
        // Needs to be removed:
        this.el.removeListener('plotly_' + eventName.toLowerCase(), this.handlers[eventName]);
        delete this.handlers[eventName];
      }
    });
  }

  render() {
    return (
      <div
        id={this.props.divId}
        style={this.props.style}
        ref={this.getRef}
        className={this.props.className}
      />
    );
  }
}
