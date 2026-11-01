import me from './images/me-small.jpg';

export default function Home() {
  return (
    <div className="row margin-top-large">
      <div className="paper container border-dashed border-thick">
        <div className="row flex-spaces" id="introduction">
          <span className="md-8 col">
            <div id="title-name">
              <h1>Hello!</h1>
            </div>
            <div id="self-intro">
              <p>Oh boy, looks like you've found my website</p>
              <p>I'm just a regular guy that likes cool things and such</p>
              <p>Feel free to take a look around, and I hope you enjoy your stay friend</p>
            </div>
          </span>
          <span className="col-4 col">
            <img src={me} title="A picture of me!" alt="Myself climbing onto sign post" id="img-of-me" />
          </span>
        </div>
      </div>
    </div>
  );
}
