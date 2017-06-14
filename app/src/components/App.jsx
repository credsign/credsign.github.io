import React from 'react';
import { HashRouter} from 'react-router-dom';
import { Switch, Route, Redirect } from 'react-router';

import Navigation from './Navigation.jsx';
import Footer from './Footer.jsx';
import Publish from './Publish.jsx';
import Account from './Account.jsx';
import Content from './Content.jsx';
import Channel from './Channel.jsx';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      account: '',
      contentID: null
    };

  }

  componentDidMount() {

  }

  render() {
    return (
      <HashRouter hashType='noslash'>
        <div style={{position: 'relative', minHeight: '100%', width: '100%', overflowY: 'auto'}} className='flex flex-column'>
          <Navigation />
          <div style={{height: '3em'}}>&nbsp;</div>
          <Switch>
            <Route path='/publish' component={Publish} />
            <Route path='/account/:address' component={Account} />
            <Route path='/:token/all/:sort?' component={Channel} />
            <Route path='/:token/:slug' component={Content} />
            <Route path='/' render={(props) => <Redirect to={'/eth/all'} /> } />
          </Switch>
          <div style={{height: '3em'}}>&nbsp;</div>
          <Footer />
        </div>
      </HashRouter>
    );
  }
}

export default App;
