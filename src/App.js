import React from 'react';
import { ContentfulClient, ContentfulProvider } from 'react-contentful';
import Home from './pages/Home';
import Blog from './pages/Blog';
import Gallery from './pages/Gallery';
import Projects from './pages/Projects';
import './paper.min.css';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom';

/*
Yes, this is generally bad practice
But all I got is a react frontend on Github Pages so what can I do really
You want to see my pictures from contentful? Fine! Go for it! hmph. >:(
*/
const contentfulClient = new ContentfulClient({
  accessToken: 'XM7gju7No_RswzOltli-n5gDcEU_rL6BjUUfXFC-94w',
  space: 'enl9nk27knfy',
});

function App() {
  return (
<ContentfulProvider client={contentfulClient}>
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
                    {/*
                    <li><Link to='/photos'>Photos</Link></li>
                    */}
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
        <Route path='/photos'>
            <Gallery/>
        </Route>
        <Route path='/blog'>
            <Blog/>
        </Route>
        <Route path='/'>
            <Home/>
        </Route>
      </Switch>
    </Router>
</ContentfulProvider>
);
}

export default App;
