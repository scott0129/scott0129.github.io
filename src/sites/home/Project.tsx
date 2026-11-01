interface ProjectProps {
  title: string;
  subtitle: string;
  detail: string;
  linkAddress: string;
  image: string;
}

export default function Project(props: ProjectProps) {
  return (
    <div className="card margin shadow shadow-small" style={{ border: '2px solid #576d74' }}>
      <div className="row margin-small">
        <div className="col" style={{ flex: '1 0 230px', display: 'grid', placeItems: 'center' }}>
          <img src={props.image} alt={props.title} />
        </div>
        <div className="card-body col" style={{ flex: '10 0 330px' }}>
          <h4 className="card-title">{props.title}</h4>
          <h5 className="card-subtitle">{props.subtitle}</h5>
          <p className="card-text">{props.detail}</p>
          <a className="card-link" href={props.linkAddress}>Check it out!</a>
        </div>
      </div>
    </div>
  );
}
