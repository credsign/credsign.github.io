import React from 'react';
import Popup from './Popup.jsx';
import { Link } from 'react-router-dom';

import {
  getContentMeta,
  prettifyTokenValue
} from '../scripts/formatting.js';

class Tips extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: '',
      tipValue: ''
    };
    this.tip = this.tip.bind(this);
  }

  tip() {
    let etherchannel = '0x1';
    let tipValue = new web3.BigNumber(this.state.tipValue || .01).times(web3.toWei(1));
    this.setState({
      tipping: true,
      error: ''
    });
    let tx = {from: window.account, value: tipValue};
    console.log(tx);
    getContentMeta(this.props.contentID, (error, contentMeta) => {
      let oldFunds = contentMeta.tipped;
      console.log(tipValue.toString());
      window.feed.tip.estimateGas(this.props.contentID, etherchannel, tipValue, tx, (error, gasEstimate) => {
        tx.gas = gasEstimate + 100000;
        window.feed.tip(this.props.contentID, etherchannel, tipValue, tx, (error, result) => {
          if (error) {
            this.setState({
              error: error.toString()
            });
          }
          else {
            let watcherFn = () => {
              getContentMeta(this.props.contentID, (error, contentMeta) => {
                let newFunds = contentMeta.tipped;
                if (newFunds != oldFunds) {
                  this.setState({
                    tipping: false
                  });
                  this.props.onTip(newFunds);
                }
                else {
                  this.setState({
                    watcherTimeout: window.setTimeout(watcherFn, 5000)
                  });
                }
              });
            }
            watcherFn();
          }
        });
      });
    });

  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.contentID != this.props.contentID || nextProps.tipped != this.props.tipped) {
      this.setState({
        tipValue: ''
      });
    }
  }

  render() {
    return (
      <div>
        <div style={{width: '100%'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{height: '1em', padding: '1em'}}>
              <div style={{color: '#777'}}>
                <div style={{float: 'left'}}>
                  <span>{`${prettifyTokenValue(this.props.tipped)} ETH total`}</span>
                </div>
                <div style={{float: 'right', color: 'black', display: window.account ? 'block' : 'none'}}>
                  <input
                    type='text'
                    placeholder='0.01'
                    value={this.state.tipValue}
                    onChange={(e) => this.setState({tipValue: e.target.value})}
                    style={{textAlign: 'right', border: 0, fontSize: '1em', width: '5em', backgroundColor: 'inherit'}}></input>
                  <span> ETH </span>
                  <a style={{display: 'inline-block', textDecoration: 'underline'}} onClick={this.tip}>Tip</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {
          this.state.tipping ?
          <Popup
            onClose={() => { clearTimeout(this.state.watcherTimeout); this.setState({tipping: false, error: '', watcherTimeout: -1}) } }
            errorHeader={'Unable to tip'}
            errorMessage={this.state.error}
            actionHeader={'Sending Tip'}
            actionMessage={'Your tip is being sent! This window should close automatically within a few minutes. If it does not, try closing this message and tipping again.'} /> : ''
        }
      </div>
    );
  }
}

export default Tips;
