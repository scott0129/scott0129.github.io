import React from 'react';
import Home from './pages/Home';
import Blog from './pages/Blog';
import Projects from './pages/Projects';
import './paper.min.css';
import './App.css';
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
                  <li><Link to='/'>Home</Link></li>
                  <li><Link to='/projects'>Projects</Link></li>
                  <li><Link to='/blog'>Blog</Link></li>
                  <li><a href='https://github.com/scott0129'>GitHub</a></li>
              </ul>
          </div>
      </div>
  </nav>
  <Switch>
    <Route path='/projects'>
      <Projects/>
    </Route>
    <Route path='/blog'>
        <Blog/>
    </Route>
    <Route path='/'>
        <Home/>
    </Route>
  </Switch>
</Router>
);
}

export default App;
