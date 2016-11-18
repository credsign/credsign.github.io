import React from 'react';
import { Match, Link } from 'react-router';

import AddressContent from './filters/AddressContent.jsx';
import AllContent from './filters/AllContent.jsx';
import ChannelContent from './filters/ChannelContent.jsx';

class Filter extends React.Component {
  constructor(props, context) {
    super(props);
    this.state = {
      filter: '',
      address: null,
      channel: null,
      contentID: null
    };

    this.setFilter = this.setFilter.bind(this);
    this.searchNav = this.searchNav.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    var filter = '';
    if (nextProps.params.type == 'channel') {
      filter = '#' + nextProps.params.value;
    }
    else if (nextProps.params.type == 'address') {
      filter = nextProps.params.value;
    }
    this.setState({
      filter: filter,
      channel: null,
      address: null
    });
  }

  setFilter(e) {
    var filter = e.target.value;

    var options = [];
    var channelMatch = filter.match(/(?:#)?([0-9a-zA-Z_]{3,30})/);
    var addressMatch = filter.match(/(?:0x)?([0-9a-fA-F]{40})/);

    var channel = null;
    var address = null;

    if (channelMatch) {
      if (filter.length < 31) {
        channel = channelMatch[1];
      }
    }

    if (addressMatch) {
      address = addressMatch[1];
    }

    this.setState({
      filter: filter,
      channel: channel,
      address: address
    });
  }

  searchNav(e) {
  }

  render() {
    return (
      <div id='filter' style={{width: '100%'}}>
        <div style={{backgroundColor: 'white'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div
              onFocus={() => {this.setState({'keying': true})}}
              onBlur={() => {this.setState({'keying': false})}}
              style={{padding: '.5em', maxHeight: this.state.keying ? '6.5em' : '2em', overflow: 'hidden'}} id='suggestions'>
              <input
                id='filterInput'
                onKeyUp={this.searchNav}
                onFocus={() => {if (!this.state.keying) { this.setState({filter: ''})}}}
                type='text' placeholder='Filter content' id='filter' value={this.state.filter} onChange={this.setFilter}
              style={{
                backgroundColor: 'transparent',
                fontSize: '1em',
                padding: '.5em',
                margin: 0,
                border: 0,
                borderRadius: 0,
                boxShadow: 'none',
                borderLeft: 0,
                backgroundColor: 'white',
                outline: 0,
                width: '100%',
                color: 'black'
              }}></input>
              <Link
                id='channelResult'
                to={`/filter/channel/${this.state.channel}`}
              style={{
                display: this.state.channel != null ? 'inline-block' : 'none',
                padding: '.5em',
                textDecoration: 'none',
                color: 'purple',
                fontWeight: 'bold'
              }}>{`#${this.state.channel}`}</Link>
              <Link
                id='addressResult'
                to={`/filter/address/0x${this.state.address}`}
              style={{
                display: this.state.address != null ? 'inline-block' : 'none',
                padding: '.5em',
                textDecoration: 'none',
                color: 'purple',
                fontWeight: 'bold'
              }}>{`0x${this.state.address}`}</Link>
              <div style={{
                fontStyle: 'italic',
                padding: '.5em',
                display: (this.state.channel == null && this.state.address == null) ? 'block' : 'none'
              }}>Enter an address or channel</div>
            </div>
          </div>
        </div>
        <div style={{maxWidth: '600px', margin: '0 auto'}}>
          <Match exactly pattern='/filter/all/new' component={AllContent} />
          <Match pattern='/filter/address/:address' component={AddressContent} />
          <Match pattern='/filter/channel/:channel' component={ChannelContent} />
        </div>
      </div>
    );
  }
}

Filter.contextTypes = {
  history: React.PropTypes.object
};

export default Filter;
