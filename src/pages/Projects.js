import React from 'react';
import Project from '../components/Project.js';

export default function Projects() {
  return (
<div class='row' style={{justifycontent: 'space-between'}}>
  <Project
    title='Rick Rolling News' 
    subtitle='Revitalization of an age-old meme' 
    detail='A fake website that where all subdirectories redirect to a Rick Roll. As an added bonus,
            the embedded thumbnails when posted to social media pages have a fairly convincing news-look.'
    linkAddress='http://www.therollingtimes.com/'
  />
  <Project
    title='Blockss' 
    subtitle='Towering Jenga structures!' 
    detail='A project that started as a small hackathon project, it&apos;s a tool for creating jenga towers!
            You can build a tower with friends, and watch it fall down under the simulated physics!'
    linkAddress='https://blockss.herokuapp.com/'
  />
  <Project 
    title='Scott.Kim' 
    subtitle='This very website!' 
    detail='From humble beginnings of Times New Roman on a plain white background,
            this website has come a long way! Taking bits of inspiration over the years,
            much thanks goes out to PaperCSS for the format theming and VimAwesome for the color scheme.'
    linkAddress='https://scott.kim'
  />
</div>
  )
}
