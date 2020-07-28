import React from 'react';
import IndexCard from './components/IndexCard';
import Projects from './components/Projects';
import './App.css';
import './paper.min.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom';


function App() {
  return (
<Router>
  <nav class='split-nav'>
      <div class='nav-brand'>
          <h3><a href='/'>Scott.Kim</a></h3>
      </div>
      <div class='collapsible'>
          <input id='collapsible1' type='checkbox' name='collapsible1'></input>
          <button>
              <label for='collapsible1'>
                  <div class='bar1'></div>
                  <div class='bar2'></div>
                  <div class='bar3'></div>
              </label>
          </button>
          <div class='collapsible-body'>
              <ul class='inline'>
                  <li><Link to='/projects'>Projects</Link></li>
                  <li><Link to='/about'>About</Link></li>
                  <li><a href='https://github.com/scott0129'>Github</a></li>
              </ul>
          </div>
      </div>
  </nav>
  <Switch>
    <Route path='/projects'>
      <Projects/>
    </Route>
    <Route path='/'>
      <div class='col'>
        <IndexCard/>
      </div>
    </Route>
  </Switch>
</Router>
);
}

export default App;
