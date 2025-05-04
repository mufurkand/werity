export default function Post() {
  return (
    <div className="bg-theme-primary-muted p-4 flex flex-col gap-2 rounded-md min-w-[300px] max-w-md flex-shrink-0 snap-start">
      <div className="flex gap-2">
        <div className="rounded-full bg-theme-splitter w-12 h-12"></div>
        <div>
          <p>John Punishing</p>
          <p className="text-theme-primary">@pgr</p>
        </div>
      </div>
      <div>
        <div className="rounded-md w-24 h-36 bg-theme-splitter float-right"></div>
        <p className="line-clamp-6">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Esse
          adipisci amet, doloremque architecto explicabo corporis assumenda
          vitae quibusdam libero? Rerum animi fuga autem nulla quo cum nihil,
          quisquam, maxime, minima sunt sapiente dolorum accusantium. Tenetur,
          ex accusantium dolore repellendus quas ratione eum magni officia vel
          libero sunt incidunt obcaecati nam provident! Architecto vero eaque
          placeat maxime, quibusdam qui similique ea laborum velit ipsa et
          pariatur. Ipsam rem officiis vitae voluptas aut a doloremque odit
          quaerat excepturi optio, possimus doloribus ea fugit tenetur maxime.
          Ab officiis accusamus porro qui aliquam! Animi voluptatum excepturi
          molestiae pariatur ut mollitia alias vero nobis!
        </p>
      </div>
    </div>
  );
}
