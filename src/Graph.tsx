import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void;
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  // Perspective table
  private table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element to attach the table from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as PerspectiveViewerElement;

    elem.setAttribute('view', 'y_line');
    elem.setAttribute('column-pivots', '["stock"]');
    elem.setAttribute('row-pivots', '["timestamp"]');
    elem.setAttribute('columns', '["top_ask_price"]');
    elem.setAttribute('aggregates', `
      {"stock": "distinct count",
      "top_ask_price": "avg",
      "timestamp": "distinct count"}`);
  
    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };
  
    this.table = window.perspective.worker().table(schema);
  
    if (this.table) {
      elem.load(this.table);
    }
  }

  componentDidUpdate() {
    if (this.table) {
      const uniqueData = this.props.data.reduce((acc, curr) => {
        const exists = acc.find(item => item.timestamp === curr.timestamp && item.stock === curr.stock);
        if (!exists) {
          acc.push(curr);
        }
        return acc;
      }, [] as ServerRespond[]);
  
      this.table.update(uniqueData.map((el: any) => {
        return {
          stock: el.stock,
          top_ask_price: el.top_ask && el.top_ask.price || 0,
          top_bid_price: el.top_bid && el.top_bid.price || 0,
          timestamp: el.timestamp,
        };
      }));
    }
  }
}

export default Graph;
