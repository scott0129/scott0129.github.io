export default function PageNotFound() {
  return (
    <div className="row margin-top-large">
      <div className="paper container border-dashed border-thick">
        <div className="text-center">
          <h1 className="margin-none"> 404 </h1>
          <h3 className="margin-top-none"> Oh no! </h3>
        </div>
        <div className="col flex-spaces text-center">
          <p> I really hope this was on purpose </p>
          <p> Otherwise it means I have to fix something :( </p>
        </div>
      </div>
    </div>
  );
}
