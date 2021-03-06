// Copyright (c) 2015 Uber Technologies, Inc.

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
import {Component, createElement} from 'react';
import PropTypes from 'prop-types';
import {PerspectiveMercatorViewport} from 'viewport-mercator-project';
import autobind from '../utils/autobind';

import {getDynamicPosition, ANCHOR_POSITION} from '../utils/dynamic-position';

const propTypes = {
  // Longitude of the anchor point
  longitude: PropTypes.number.isRequired,
  // Latitude of the anchor point
  latitude: PropTypes.number.isRequired,
  // Offset from the left
  offsetLeft: PropTypes.number,
  // Offset from the top
  offsetTop: PropTypes.number,
  // Size of the tip
  tipSize: PropTypes.number,
  // Whether to show close button
  closeButton: PropTypes.bool,
  // Whether to close on click
  closeOnClick: PropTypes.bool,
  // The popup's location relative to the coordinate
  anchor: PropTypes.oneOf(Object.keys(ANCHOR_POSITION)),
  // Whether the popup anchor should be auto-adjusted to fit within the container
  dynamicPosition: PropTypes.bool,
  // Callback when component is closed
  onClose: PropTypes.func
};

const defaultProps = {
  offsetLeft: 0,
  offsetTop: 0,
  tipSize: 10,
  anchor: 'bottom',
  dynamicPosition: true,
  closeButton: true,
  closeOnClick: true,
  onClose: () => {}
};

const contextTypes = {
  viewport: PropTypes.instanceOf(PerspectiveMercatorViewport)
};

/*
 * PureComponent doesn't update when context changes.
 * The only way is to implement our own shouldComponentUpdate here. Considering
 * the parent component (StaticMap or InteractiveMap) is pure, and map re-render
 * is almost always triggered by a viewport change, we almost definitely need to
 * recalculate the popup's position when the parent re-renders.
 */
export default class Popup extends Component {

  constructor(props) {
    super(props);
    autobind(this);
  }

  componentDidMount() {
    // Container just got a size, re-calculate position
    this.forceUpdate();
  }

  _getPosition(x, y) {
    const {viewport} = this.context;
    const {anchor, dynamicPosition, tipSize} = this.props;

    const {content} = this.refs;
    if (content) {
      return dynamicPosition ? getDynamicPosition({
        x, y, anchor,
        padding: tipSize,
        width: viewport.width,
        height: viewport.height,
        selfWidth: content.clientWidth,
        selfHeight: content.clientHeight
      }) : anchor;
    }

    return anchor;
  }

  _onClose() {
    this.props.onClose();
  }

  _renderTip() {
    const {tipSize} = this.props;

    return createElement('div', {
      key: 'tip',
      className: 'mapboxgl-popup-tip',
      style: {borderWidth: tipSize}
    });
  }

  _renderContent() {
    const {closeButton, children} = this.props;
    return createElement('div', {
      key: 'content',
      ref: 'content',
      className: 'mapboxgl-popup-content'
    }, [
      closeButton && createElement('button', {
        key: 'close-button',
        className: 'mapboxgl-popup-close-button',
        type: 'button',
        onClick: this._onClose
      }, '??'),
      children
    ]);
  }

  render() {
    const {longitude, latitude, offsetLeft, offsetTop, closeOnClick} = this.props;

    const [x, y] = this.context.viewport.project([longitude, latitude]);

    const positionType = this._getPosition(x, y);
    const anchorPosition = ANCHOR_POSITION[positionType];

    const containerStyle = {
      position: 'absolute',
      left: x + offsetLeft,
      top: y + offsetTop,
      transform: `translate(${-anchorPosition.x * 100}%, ${-anchorPosition.y * 100}%)`
    };

    return createElement('div', {
      className: `mapboxgl-popup mapboxgl-popup-anchor-${positionType}`,
      style: containerStyle,
      onClick: closeOnClick ? this._onClose : null
    }, [
      this._renderTip(),
      this._renderContent()
    ]);
  }

}

Popup.displayName = 'Popup';
Popup.propTypes = propTypes;
Popup.defaultProps = defaultProps;
Popup.contextTypes = contextTypes;
