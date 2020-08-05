import React from 'react';
import Project from '../components/Project.js';
import blockss from '../images/blockss.png'
import rrtimes from '../images/rolling-times.png'
import teapot from '../images/teapot.png'
import scottkim from '../images/scottkim.png'

export default function Projects() {
  return (
<div class='col'>
  <div class='paper container border-dashed border-thick'>
    <h1 class='margin-none'>Some stuff I made</h1>
    <div class='row child-borders' style={{justifycontent: 'space-between'}}>
      <Project
        title='Rick Rolling News' 
        subtitle='Revitalization of an age-old meme' 
        detail='A fake website that where all subdirectories redirect to a Rick Roll. As an added bonus,
                the embedded thumbnails when posted to social media pages have a fairly convincing news-look.'
        linkAddress='http://www.therollingtimes.com/'
        image={rrtimes}
      />
      {/* 
      <Project
        title='Haskell Interpreter' 
        subtitle='Interpret haskell' 
        detail='and do stuff'
        linkAddress='https://blockss.herokuapp.com/'
        image={blockss}
      />
      */}
      <Project
        title='Blockss' 
        subtitle='Jenga but like, free spirited' 
        detail='My friend loves to create Jenga towers, and suggested that we make this Block Stacking Simulator for a hackathon! 
                The result of our two-day endeavor was a web toy with a simple but charming joy to it.'
        linkAddress='https://blockss.herokuapp.com/'
        image={blockss}
      />
      <Project
        title='C++ Raytracer' 
        subtitle='Tracin&apos; rays through thick and thin' 
        detail='A raytracer I wrote back in Freshman year as a part of a course in data structures,
                it doesn&apos;t really have many bells and whistles. Rather, it doesn&apos;t have any. 
                I&apos;m surprised that it worked at all, to be honest!'
        linkAddress='https://github.com/scott0129/raytracer'
        image={teapot}
      />
      <Project 
        title='Scott.Kim' 
        subtitle='This very website!' 
        detail='From humble beginnings of Times New Roman on a plain white background,
                this website has come a long way! Taking bits of inspiration over the years,
                much thanks goes out to PaperCSS for the format theming and VimAwesome for the color scheme.'
        linkAddress='https://scott.kim'
        image={scottkim}
      />
    </div>
  </div>
</div>
  )
}
