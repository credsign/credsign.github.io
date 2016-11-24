import React from 'react';
import { Link } from 'react-router';

class Navigation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      warn: false
    };
    this.warn = this.warn.bind(this);
  }

  warn(e) {
    if (window.infura || !window.account) {
      e.stopPropagation();
      e.preventDefault();
      this.setState({
        warn: true
      });
    }
  }

  render() {
    return (
      <div>
        <div style={{
          position: 'fixed',
          width: '100%',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #DDD',
          color: 'black',
          top: 0,
          zIndex: 10
        }}>
          <div style={{maxWidth: '600px', margin: '0 auto'}} className='flex'>
            <div className='flex-grow' style={{textAlign: 'left'}}>
              <Link to={`/address/${window.account || ''}`} onClick={this.warn} style={{textDecoration: 'none', display: 'inline-block', padding: '1em'}}>
                <i className='fa fa-user'></i>
              </Link>
            </div>
            <div className='flex-shrink'>
              <Link to='/channel' style={{textDecoration: 'none', display: 'inline-block'}}>
                <img src='/app/logo.svg' style={{width: '1.5em', height: '1.5em', margin: '0 auto', padding: '.75em'}} />
              </Link>
            </div>
            <div className='flex-grow' style={{textAlign: 'right'}}>
              <Link to='/publish' onClick={this.warn} style={{textDecoration: 'none', display: 'inline-block', padding: '1em'}}>
                <i className='fa fa-pencil'></i>
              </Link>
            </div>
          </div>
        </div>
        <div style={{display: this.state.warn ? 'block' : 'none'}}>
          <div className='backdrop' style={{
            width: '100%',
            height: '100%',
            opacity: 0.5,
            backgroundColor: 'black',
            position: 'fixed',
            zIndex: 1,
            top: '0',
            left: '0'
          }}>{' '}</div>
          <div style={{
            top: '25%',
            left: '0',
            margin: '0 auto',
            width: '100%',
            zIndex: 2,
            position: 'fixed',
            backgroundColor: 'transparent'
          }}>
            <div style={{maxWidth: '600px', margin: '0 auto', backgroundColor: '#FCFCFC', border: '1px solid #DDD'}}>
              <div style={{padding: '1em'}}>
                <h1>Wallet Required</h1>
                <div style={{padding: '1em 0'}}>{
                  `No Ethereum accounts were detected. Please ensure that you have `
                }<Link to={'https://github.com/ethereum/mist/releases'}>Mist</Link>{
                  ' or '
                }<Link to={'https://metamask.io'}>MetaMask</Link>{
                  ` installed and are connected to the proper network (${window.network}).`
                }</div>
                <span onClick={() => this.setState({warn: false})} style={{
                  textDecoration: 'underline',
                  display: 'inline-block',
                  cursor: 'pointer'
                }}>Close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Navigation;