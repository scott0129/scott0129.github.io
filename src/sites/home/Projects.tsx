import Project from './Project';
import blockss from './images/blockss.png';
import rrtimes from './images/rolling-times.png';
import teapot from './images/teapot.png';
import scottkim from './images/scottkim.png';

export default function Projects() {
  return (
    <div className="row margin-top-large">
      <div className="paper container border-dashed border-thick">
        <div className="text-center">
          <h1 className="margin-none">Projects</h1>
          <h3 className="margin-top-none">Many of these really aren't super useful</h3>
        </div>
        <div className="row child-borders" style={{ justifyContent: 'space-between' }}>
          <Project
            title="Rick Rolling News"
            subtitle="Revitalization of an age-old meme"
            detail="A fake website that where all subdirectories redirect to a Rick Roll. As an added bonus,
                    the embedded thumbnails when posted to social media pages have a fairly convincing news-look."
            linkAddress="http://www.therollingtimes.com/"
            image={rrtimes}
          />
          <Project
            title="Blockss"
            subtitle="Jenga but like, free spirited"
            detail="My friend loves to create Jenga towers, and suggested that we make this Block Stacking Simulator for a hackathon!
                    The result of our two-day endeavor was a web toy with a simple but charming joy to it."
            linkAddress="https://blockss.herokuapp.com/"
            image={blockss}
          />
          <Project
            title="C++ Raytracer"
            subtitle="Tracin' rays through thick and thin"
            detail="A raytracer I wrote back in Freshman year as a part of a course in data structures,
                    it doesn't really have many bells and whistles. Rather, it doesn't have any.
                    I'm surprised that it worked at all, to be honest!"
            linkAddress="https://github.com/scott0129/raytracer"
            image={teapot}
          />
          <Project
            title="Scott.Kim"
            subtitle="This very website!"
            detail="From humble beginnings of Times New Roman on a plain white background,
                    this website has come a long way! Taking bits of inspiration over the years,
                    much thanks goes out to PaperCSS for the format theming and VimAwesome for the color scheme."
            linkAddress="https://scott.kim"
            image={scottkim}
          />
        </div>
      </div>
    </div>
  );
}
